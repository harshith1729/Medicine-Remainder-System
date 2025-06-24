require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const twilio = require("twilio");

// Twilio Setup
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.error("❌ Twilio credentials missing. Check .env file!");
    process.exit(1);
}

const client = new twilio(accountSid, authToken);

// App Config
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Fixed deprecated warning
app.use(cors());

// DB Config
mongoose.connect('mongodb://localhost:27017/medicineReminderDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Reminder Schema
const reminderSchema = new mongoose.Schema({
    reminderMsg: { type: String, required: true },
    remindAt: { type: Date, required: true },  // Ensuring it's stored as Date
    isReminded: { type: Boolean, default: false }
});

const Reminder = mongoose.model("Reminder", reminderSchema);

// Interval to Check & Send Reminders
setInterval(async () => {
    try {
        const reminderList = await Reminder.find({ isReminded: false }).exec();
        const now = new Date();

        reminderList.forEach(async (reminder) => {
            if (reminder.remindAt && new Date(reminder.remindAt) <= now) {
                await Reminder.findByIdAndUpdate(reminder._id, { isReminded: true });

                // WhatsApp Reminder Message (with 💊 emoji)
                client.messages.create({
                    body: `💊 Medicine Reminder: ${reminder.reminderMsg}.`,
                    from: "whatsapp:+14155238886",
                    to: "whatsapp:+91" // Replace with your phone number
                }).then((message) => console.log("✅ Reminder Sent:", message.sid))
                  .catch((error) => console.error("❌ Twilio Error:", error));
            }
        });
    } catch (error) {
        console.error("❌ Reminder Check Error:", error);
    }
}, 10000);

// API Routes

// Get All Reminders
app.get("/getAllReminder", async (req, res) => {
    try {
        const reminders = await Reminder.find({});
        res.json(reminders);
    } catch (error) {
        console.error("❌ Fetch Reminders Error:", error);
        res.status(500).send("An error occurred");
    }
});

// Add Reminder
app.post("/addReminder", async (req, res) => {
    try {
        const { reminderMsg, remindAt } = req.body;

        if (!reminderMsg || !remindAt) {
            return res.status(400).json({ error: "reminderMsg and remindAt are required" });
        }

        const reminder = new Reminder({
            reminderMsg,
            remindAt: new Date(remindAt),
            isReminded: false
        });

        await reminder.save();
        const reminders = await Reminder.find({});
        res.json(reminders);
    } catch (error) {
        console.error("❌ Add Reminder Error:", error);
        res.status(500).send("An error occurred");
    }
});

// Delete Reminder
app.post("/deleteReminder", async (req, res) => {
    try {
        if (!req.body.id) {
            return res.status(400).json({ error: "Reminder ID is required" });
        }

        await Reminder.findByIdAndDelete(req.body.id);
        const reminders = await Reminder.find({});
        res.json(reminders);
    } catch (error) {
        console.error("❌ Delete Reminder Error:", error);
        res.status(500).send("An error occurred");
    }
});

// Start Server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
