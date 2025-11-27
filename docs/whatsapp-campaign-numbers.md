# WhatsApp Campaign Number Assignment System

## 🎯 Problem Solved

Prevents duplicate numbers from being sent to different assistants by persisting assigned numbers in the database.

## 🔧 How It Works

### 1. **Initial Assignment**

When an assistant receives their first campaign message:

- System finds the next available number (1-30)
- Checks against all existing assignments to avoid duplicates
- Saves the number to `metadata.campaignNumber` in the database

### 2. **Subsequent Campaigns**

When the same assistant is selected again:

- System reads their existing `metadata.campaignNumber`
- Uses the **same number** consistently
- No new number is generated

### 3. **Number Pool Management**

- Pool range: **1-30** (configurable)
- Smart allocation: Avoids conflicts across all assistants
- If all 30 numbers are used, cycles back (rare case)

## 📊 Database Schema

The assigned number is stored in the assistant's metadata:

```json
{
  "metadata": {
    "campaignNumber": 15,
    "lastCampaignSent": "2025-11-27T10:30:00Z"
  }
}
```

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ User selects assistants & clicks "Enviar WhatsApp" │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ Load all existing numbers   │
    │ from metadata of all        │
    │ assistants in database      │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ For each selected assistant:│
    └─────────────┬───────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Has number in  │
         │ metadata?      │
         └────┬──────┬────┘
              │      │
         YES  │      │  NO
              │      │
              ▼      ▼
    ┌──────────┐  ┌─────────────────┐
    │ Use      │  │ Find next       │
    │ existing │  │ available       │
    │ number   │  │ number (1-30)   │
    └────┬─────┘  └────┬────────────┘
         │             │
         │             ▼
         │    ┌────────────────────┐
         │    │ Save new number to │
         │    │ metadata in DB     │
         │    └────────┬───────────┘
         │             │
         └─────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ Send WhatsApp message with  │
    │ assigned number             │
    └─────────────────────────────┘
```

## 💡 Benefits

### ✅ **Consistency**

Each assistant always receives the same number across all campaigns

### ✅ **No Duplicates**

System-wide tracking prevents two assistants from getting the same number

### ✅ **Persistence**

Numbers survive page refreshes, deployments, and database restarts

### ✅ **Tracking**

`lastCampaignSent` timestamp tracks when messages were sent

### ✅ **Scalability**

Can easily extend the range (e.g., 1-100) by changing logic

## 🔍 Verification

You can verify number assignments by:

1. **In the Database:**

   ```sql
   SELECT id, "firstName", "lastName", metadata
   FROM event_assistants
   WHERE metadata->>'campaignNumber' IS NOT NULL;
   ```

2. **In Browser Console:**
   After sending a campaign, check the log:

   ```
   ✅ Saved 5 number assignments to database
   ```

3. **GraphQL Query:**
   ```graphql
   query {
     eventAssistants {
       id
       firstName
       lastName
       metadata
     }
   }
   ```

## ⚙️ Configuration

To change the number range, update in `handleSendWhatsAppCampaign`:

```typescript
// Current: 1-30
assignedNumber = 1;
while (usedNumbers.has(assignedNumber) && assignedNumber <= 30) {
  assignedNumber++;
}

// To change to 1-50:
while (usedNumbers.has(assignedNumber) && assignedNumber <= 50) {
  assignedNumber++;
}
```

## 🚨 Edge Cases Handled

1. **New Assistant:** Gets next available number
2. **Existing Assistant:** Keeps their assigned number
3. **All Numbers Used:** Cycles back (rare with 30 numbers)
4. **Metadata Save Fails:** Campaign still sends (logged error)
5. **Multiple Events:** Each assistant has one global number across all events

## 🔄 Future Enhancements

- **Event-Specific Numbers:** Different numbers per event
- **Number Expiry:** Reset numbers after X days
- **Admin Interface:** View/edit assigned numbers
- **Bulk Reset:** Clear all assignments for new campaign
