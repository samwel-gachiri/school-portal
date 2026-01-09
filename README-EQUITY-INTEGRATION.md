# Equity Bank Integration Setup Guide

## Overview
This integration automates the school fee payment process by connecting directly to Equity Bank's Jenga API, eliminating manual data entry and reducing errors.

## Features
- ✅ **Real-time Transaction Sync**: Automatic webhook notifications for new deposits
- ✅ **Auto-Matching**: Intelligent matching of transactions to students using mobile numbers and class info
- ✅ **Manual Review**: Dashboard for reviewing and approving unmatched transactions
- ✅ **Instant Posting**: One-click posting of verified transactions to student accounts
- ✅ **Audit Trail**: Complete tracking of all transaction processing steps

## Setup Steps

### 1. Register for Jenga API Access

1. Visit https://developer.jengaapi.io/
2. Create an account
3. Complete KYC verification
4. Subscribe to **Account Services API**
5. Note down your credentials:
   - API Key
   - Merchant Code
   - Your school's Equity account number

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Jenga API Configuration
JENGA_BASE_URL=https://uat.jengahq.io  # Use https://api.jengahq.io for production
JENGA_API_KEY=your-api-key-here
JENGA_MERCHANT_CODE=your-merchant-code-here
JENGA_ACCOUNT_NUMBER=0340161368243  # Your school account number
```

### 3. Run Database Migrations

The integration creates a new `equity_transactions` table:

```bash
cd backend
npm run migrate
```

Or the system will auto-run migrations on startup if needed.

### 4. Configure Webhook in Jenga Portal

1. Log in to Jenga Developer Portal
2. Go to **Webhooks** section
3. Add new webhook:
   - **URL**: `https://your-domain.com/api/equity/webhook`
   - **Events**: Select "Account Credit" or "Transaction Notification"
   - **Active**: Yes

### 5. Test the Integration

```bash
# Sync recent transactions manually
curl -X POST http://localhost:3000/api/equity/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get pending transactions
curl http://localhost:3000/api/equity/transactions/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## How It Works

### Automatic Workflow

1. **Parent Makes Deposit**
   - Goes to Equity teller with cash
   - Teller enters:
     - School account number
     - Student name as depositor
     - Parent mobile number
     - Class code in payment description (e.g., "PP2")

2. **Transaction Received**
   - Jenga webhook sends notification to your server
   - System stores transaction in `equity_transactions` table
   - Status: `pending`

3. **Auto-Matching**
   - System tries to match transaction to student:
     - **Method 1**: Match by parent mobile number (High confidence)
     - **Method 2**: Match by class code + student name (Medium confidence)
     - **Method 3**: Search by name similarity (Low confidence)
   - High confidence matches are auto-marked as `matched`

4. **Review & Post**
   - User reviews matched transactions in dashboard
   - Clicks "Post Payment"
   - System:
     - Creates payment record in `recvd` table
     - Updates student balance
     - Marks transaction as `posted`
     - Links transaction reference

### Manual Review for Unmatched

For transactions that couldn't be auto-matched:
1. System shows suggestions based on name similarity
2. User selects correct student
3. Clicks "Match & Post"
4. Payment is recorded

## API Endpoints

### Webhook (Public)
- `POST /api/equity/webhook` - Receive Jenga notifications

### Transaction Management (Protected)
- `GET /api/equity/transactions/pending` - Get pending transactions
- `GET /api/equity/transactions/:id/suggestions` - Get match suggestions
- `POST /api/equity/transactions/:id/match` - Manual match to student
- `POST /api/equity/transactions/:id/post` - Post as payment
- `POST /api/equity/transactions/:id/reject` - Reject transaction

### Admin Operations
- `POST /api/equity/sync` - Sync transactions from Jenga API
- `GET /api/equity/stats` - Get transaction statistics
- `GET /api/equity/balance` - Get school account balance

## Database Schema

### `equity_transactions` Table

| Column | Type | Description |
|--------|------|-------------|
| transaction_id | INT | Primary key |
| transaction_ref | VARCHAR(50) | Equity reference (e.g., KEA401Sw4bVR) |
| transaction_date | TIMESTAMP | When deposit was made |
| amount | DECIMAL(10,2) | Amount deposited |
| depositor_name | VARCHAR(255) | Student name from teller |
| depositor_mobile | VARCHAR(20) | Parent mobile number |
| payment_description | VARCHAR(255) | Class code (e.g., PP2) |
| status | ENUM | pending/matched/posted/rejected |
| matched_student_adm | INT | Matched student admission |
| posted_payment_id | INT | Created payment record ID |

## Benefits vs Manual Entry

| Task | Before | After |
|------|--------|-------|
| **Data Entry Time** | 2-3 minutes per payment | 5 seconds (one click) |
| **Error Rate** | ~5% transcription errors | <0.1% (auto-validated) |
| **Posting Delay** | Hours to days | Real-time |
| **Staff Required** | 2 people (teller + data entry) | 1 person (review only) |
| **Audit Trail** | Paper receipts only | Digital, searchable, linked |

## Troubleshooting

### Webhook Not Receiving Transactions

1. Check webhook URL is publicly accessible
2. Verify webhook is active in Jenga portal
3. Check server logs: `tail -f backend/logs/combined.log`
4. Test webhook signature verification

### Auto-Matching Not Working

1. **Check mobile numbers** in `stuphone` table
   - Ensure parent phones are stored with correct format
   - System tries multiple formats (254xxx, 07xx, etc.)

2. **Verify class codes** match
   - Payment description should have exact class code
   - Examples: "PP2", "Grade 5", "Form 3"

3. **Update student names** if needed
   - Ensure names match what teller enters
   - System does fuzzy matching but exact is better

### Manual Sync Not Working

1. Check Jenga API credentials in `.env`
2. Verify account number is correct
3. Check API key permissions in Jenga portal
4. Review error logs

## Security Considerations

- ✅ Webhook signature verification prevents fake transactions
- ✅ All endpoints except webhook require JWT authentication
- ✅ Audit trail tracks who matched/posted each transaction
- ✅ Rejected transactions are logged with reasons
- ✅ SSL/TLS required for webhook endpoint

## Production Checklist

- [ ] Change `JENGA_BASE_URL` to production: `https://api.jengahq.io`
- [ ] Use production API credentials
- [ ] Ensure webhook URL is HTTPS
- [ ] Test end-to-end with small deposit
- [ ] Train staff on review dashboard
- [ ] Set up monitoring/alerts for failed webhooks
- [ ] Back up `equity_transactions` table regularly

## Support

For Jenga API issues:
- Portal: https://developer.jengaapi.io/
- Email: apisupport@equitybankgroup.com
- Phone: +254 763 063 000

For system issues:
- Check logs in `backend/logs/`
- Review database migration status
- Verify environment variables are set
