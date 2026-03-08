;; StacksForge Token Factory
;; Register and track SIP-010 tokens created on Stacks
;; Frontend uses @stacks/connect and @stacks/transactions

;; ============================================================
;; Error constants
;; ============================================================
(define-constant ERR-UNAUTHORIZED         (err u200))
(define-constant ERR-NOT-OWNER            (err u201))
(define-constant ERR-INSUFFICIENT-FEE    (err u202))
(define-constant ERR-INVALID-NAME        (err u203))
(define-constant ERR-INVALID-SYMBOL      (err u204))
(define-constant ERR-INVALID-SUPPLY      (err u205))
(define-constant ERR-INVALID-DECIMALS    (err u206))
(define-constant ERR-INVALID-RECIPIENT   (err u207))
(define-constant ERR-TOKEN-NOT-FOUND     (err u208))
(define-constant ERR-INDEX-OUT-OF-BOUNDS (err u209))
(define-constant ERR-TRANSFER-FAILED     (err u210))
(define-constant ERR-NAME-TOO-LONG       (err u211))
(define-constant ERR-SYMBOL-TOO-LONG     (err u212))

;; ============================================================
;; Constants
;; ============================================================
(define-constant MAX-NAME-LEN   u64)
(define-constant MAX-SYMBOL-LEN u11)
(define-constant MAX-DECIMALS   u18)
(define-constant CONTRACT-VERSION "v-i2")

;; ============================================================
;; Data Variables
;; ============================================================

;; Owner / admin address
(define-data-var contract-owner     principal tx-sender)

;; Address that receives creation fees
(define-data-var fee-recipient      principal tx-sender)

;; Fee to create a token (in microSTX, 1 STX = 1,000,000 uSTX)
;; Default: 0.002 STX
(define-data-var creation-fee       uint      u2000)

;; Total number of tokens registered
(define-data-var token-count        uint      u0)

;; Total fees collected (analytics)
(define-data-var total-fees-collected uint    u0)

;; ============================================================
;; Data Maps
;; ============================================================

;; All tokens by index (0-based)
(define-map deployed-tokens uint {
  token-id:    uint,
  name:        (string-ascii 64),
  symbol:      (string-ascii 11),
  decimals:    uint,
  supply:      uint,
  creator:     principal,
  created-at:  uint
})

;; List of token IDs per creator
(define-map tokens-by-creator principal (list 500 uint))

;; Token lookup by id
(define-map token-exists uint bool)

;; ============================================================
;; Events
;; ============================================================

;; ============================================================
;; Public Functions
;; ============================================================

;; Register / create a new token
;; Caller pays creation-fee in STX
(define-public (create-token
    (name     (string-ascii 64))
    (symbol   (string-ascii 11))
    (decimals uint)
    (supply   uint))
  (let (
    (fee          (var-get creation-fee))
    (recipient    (var-get fee-recipient))
    (new-id       (var-get token-count))
    (caller       tx-sender)
  )
    ;; Validate inputs
    (asserts! (> (len name) u0)       ERR-INVALID-NAME)
    (asserts! (<= (len name) MAX-NAME-LEN)   ERR-NAME-TOO-LONG)
    (asserts! (> (len symbol) u0)     ERR-INVALID-SYMBOL)
    (asserts! (<= (len symbol) MAX-SYMBOL-LEN) ERR-SYMBOL-TOO-LONG)
    (asserts! (<= decimals MAX-DECIMALS)      ERR-INVALID-DECIMALS)
    (asserts! (> supply u0)           ERR-INVALID-SUPPLY)

    ;; Collect creation fee
    (if (> fee u0)
      (begin
        (try! (stx-transfer? fee caller recipient))
        (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
      )
      true
    )

    ;; Store token record
    (map-set deployed-tokens new-id {
      token-id:   new-id,
      name:       name,
      symbol:     symbol,
      decimals:   decimals,
      supply:     supply,
      creator:    caller,
      created-at: block-height
    })

    ;; Mark token as existing
    (map-set token-exists new-id true)

    ;; Update creator list
    (let ((existing (default-to (list) (map-get? tokens-by-creator caller))))
      (map-set tokens-by-creator caller (unwrap! (as-max-len? (append existing new-id) u500) ERR-UNAUTHORIZED))
    )

    ;; Increment counter
    (var-set token-count (+ new-id u1))

    ;; Emit event
    (print {
      event:      "token-created",
      token-id:   new-id,
      name:       name,
      symbol:     symbol,
      decimals:   decimals,
      supply:     supply,
      creator:    caller,
      block:      block-height
    })

    (ok new-id)
  )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get total number of registered tokens
(define-read-only (get-token-count)
  (ok (var-get token-count))
)

;; Get a token record by its numeric ID
(define-read-only (get-token-by-id (token-id uint))
  (match (map-get? deployed-tokens token-id)
    token (ok token)
    ERR-TOKEN-NOT-FOUND
  )
)

;; Get all token IDs created by a specific principal
(define-read-only (get-tokens-by-creator (creator principal))
  (ok (default-to (list) (map-get? tokens-by-creator creator)))
)

;; Get number of tokens created by a specific principal
(define-read-only (get-token-count-by-creator (creator principal))
  (ok (len (default-to (list) (map-get? tokens-by-creator creator))))
)

;; Get current creation fee
(define-read-only (get-creation-fee)
  (ok (var-get creation-fee))
)

;; Get fee recipient
(define-read-only (get-fee-recipient)
  (ok (var-get fee-recipient))
)

;; Get contract owner
(define-read-only (get-owner)
  (ok (var-get contract-owner))
)

;; Get total fees collected
(define-read-only (get-total-fees-collected)
  (ok (var-get total-fees-collected))
)

;; Get contract version
(define-read-only (get-version)
  (ok CONTRACT-VERSION)
)

;; Get full contract info
(define-read-only (get-contract-info)
  (ok {
    owner:                (var-get contract-owner),
    fee-recipient:        (var-get fee-recipient),
    creation-fee:         (var-get creation-fee),
    token-count:          (var-get token-count),
    total-fees-collected: (var-get total-fees-collected),
    version:              CONTRACT-VERSION
  })
)

;; ============================================================
;; Admin Functions - only contract-owner
;; ============================================================

;; Update creation fee
(define-public (set-creation-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (let ((old-fee (var-get creation-fee)))
      (var-set creation-fee new-fee)
      (print {
        event:   "creation-fee-updated",
        old-fee: old-fee,
        new-fee: new-fee
      })
      (ok true)
    )
  )
)

;; Update fee recipient
(define-public (set-fee-recipient (new-recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (let ((old-recipient (var-get fee-recipient)))
      (var-set fee-recipient new-recipient)
      (print {
        event:         "fee-recipient-updated",
        old-recipient: old-recipient,
        new-recipient: new-recipient
      })
      (ok true)
    )
  )
)

;; Transfer ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (let ((old-owner (var-get contract-owner)))
      (var-set contract-owner new-owner)
      (print {
        event:     "ownership-transferred",
        old-owner: old-owner,
        new-owner: new-owner
      })
      (ok true)
    )
  )
)
