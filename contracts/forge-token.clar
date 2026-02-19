;; StacksForge Token Contract
;; SIP-010 Fungible Token implementation for tokens created via StacksForge
;; Uses @stacks/connect and @stacks/transactions on the frontend

(impl-trait .sip-010-trait.sip-010-trait)

;; ============================================================
;; Error constants
;; ============================================================
(define-constant ERR-UNAUTHORIZED        (err u100))
(define-constant ERR-NOT-OWNER           (err u101))
(define-constant ERR-INSUFFICIENT-FUNDS  (err u102))
(define-constant ERR-INVALID-AMOUNT      (err u103))
(define-constant ERR-INVALID-RECIPIENT   (err u104))

;; ============================================================
;; Token data variables
;; ============================================================

;; The SIP-010 fungible token  
(define-fungible-token forge-token)

;; Token metadata
(define-data-var token-name       (string-ascii 32)  "ForgeToken")
(define-data-var token-symbol     (string-ascii 32)  "FORGE")
(define-data-var token-decimals   uint               u6)
(define-data-var token-uri        (optional (string-utf8 256)) none)

;; Administrative state
(define-data-var contract-owner   principal          tx-sender)
(define-data-var factory-address  (optional principal) none)
(define-data-var created-at-block uint               block-height)
(define-data-var token-id         uint               u0)

;; ============================================================
;; SIP-010 Trait Implementation
;; ============================================================

;; Transfer tokens to a recipient
(define-public (transfer
    (amount     uint)
    (sender     principal)
    (recipient  principal)
    (memo       (optional (buff 34))))
  (begin
    (asserts! (> amount u0)                   ERR-INVALID-AMOUNT)
    (asserts! (is-eq tx-sender sender)        ERR-UNAUTHORIZED)
    (asserts! (not (is-eq sender recipient))  ERR-INVALID-RECIPIENT)
    (try! (ft-transfer? forge-token amount sender recipient))
    (match memo m (print m) true)
    (print {
      event:     "token-transfer",
      sender:    sender,
      recipient: recipient,
      amount:    amount
    })
    (ok true)
  )
)

;; Get token name
(define-read-only (get-name)
  (ok (var-get token-name))
)

;; Get token symbol
(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

;; Get token decimals
(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

;; Get token balance for a principal
(define-read-only (get-balance (account principal))
  (ok (ft-get-balance forge-token account))
)

;; Get total supply
(define-read-only (get-total-supply)
  (ok (ft-get-supply forge-token))
)

;; Get token URI
(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; ============================================================
;; Admin / Minting Functions
;; ============================================================

;; Initialise token metadata - called once by the factory
(define-public (initialize
    (name     (string-ascii 32))
    (symbol   (string-ascii 32))
    (decimals uint)
    (supply   uint)
    (owner    principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (var-set token-name     name)
    (var-set token-symbol   symbol)
    (var-set token-decimals decimals)
    (var-set factory-address (some tx-sender))
    (try! (ft-mint? forge-token supply owner))
    (print {
      event:           "token-initialized",
      name:            name,
      symbol:          symbol,
      decimals:        decimals,
      initial-supply:  supply,
      owner:           owner,
      block:           block-height
    })
    (ok true)
  )
)

;; Burn tokens (any token holder can burn their own)
(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-UNAUTHORIZED)
    (asserts! (> amount u0)            ERR-INVALID-AMOUNT)
    (try! (ft-burn? forge-token amount sender))
    (print {
      event:  "token-burned",
      burner: sender,
      amount: amount
    })
    (ok true)
  )
)

;; Mint additional tokens - only owner
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-mint? forge-token amount recipient))
    (print {
      event:     "token-minted",
      recipient: recipient,
      amount:    amount
    })
    (ok true)
  )
)

;; Transfer ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (print {
      event:      "ownership-transferred",
      old-owner:  (var-get contract-owner),
      new-owner:  new-owner
    })
    (var-set contract-owner new-owner)
    (ok true)
  )
)

;; Set token URI
(define-public (set-token-uri (uri (optional (string-utf8 256))))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (var-set token-uri uri)
    (ok true)
  )
)

;; ============================================================
;; Read-only helpers
;; ============================================================

(define-read-only (get-owner)
  (ok (var-get contract-owner))
)

(define-read-only (get-factory)
  (ok (var-get factory-address))
)

(define-read-only (get-created-at-block)
  (ok (var-get created-at-block))
)

(define-read-only (get-token-info)
  (ok {
    name:          (var-get token-name),
    symbol:        (var-get token-symbol),
    decimals:      (var-get token-decimals),
    total-supply:  (ft-get-supply forge-token),
    owner:         (var-get contract-owner),
    factory:       (var-get factory-address),
    created-at:    (var-get created-at-block)
  })
)
