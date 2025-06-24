import './App.css';
import React, { useState, useEffect } from "react";
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import axios from 'axios';
import DateTimePicker from "react-datetime-picker";

function App() {
  const [reminderMsg, setReminderMsg] = useState("");
  const [remindAt, setRemindAt] = useState(null);
  const [reminderList, setReminderList] = useState([]);

  // Fetch reminders from backend
  useEffect(() => {
    axios.get("http://localhost:9000/getAllReminder")
      .then(res => {
        setReminderList(res.data);
        console.log("Fetched reminders:", res.data);
      })
      .catch(error => console.error("Error fetching reminders:", error));
  }, []);

  // Add reminder function
  const addReminder = () => {
    if (!reminderMsg || !remindAt) {
      alert("Please enter a valid message and select a reminder time!");
      return;
    }

    axios.post("http://localhost:9000/addReminder", { reminderMsg, remindAt })
      .then(res => {
        setReminderList(res.data);
        setReminderMsg("");
        setRemindAt(null);
      })
      .catch(error => console.error("Error adding reminder:", error));
  };

  // Delete reminder function
  const deleteReminder = (id) => {
    axios.post("http://localhost:9000/deleteReminder", { id })
      .then(res => setReminderList(res.data))
      .catch(error => console.error("Error deleting reminder:", error));
  };

  return (
    <div className="App">
      <div className="homepage">
        <div className="homepage_header">
          <h1>MEDICINE REMINDER</h1>
          <h2>Never Miss a Dose Again</h2>
          <input 
            type="text" 
            placeholder="Enter the Medicine Name 💊" 
            value={reminderMsg} 
            onChange={e => setReminderMsg(e.target.value)} 
          />
          <DateTimePicker 
            value={remindAt}
            onChange={setRemindAt}
            minutePlaceholder="mm"
            hourPlaceholder="hh"
            dayPlaceholder="DD"
            monthPlaceholder="MM"
            yearPlaceholder="YYYY"
          />
          <div className="button" onClick={addReminder}>Add Reminder</div>
        </div>

        <div className="homepage_body">
          {reminderList.length > 0 ? (
            reminderList.map(reminder => (
              <div className="reminder_card" key={reminder._id}>
                <h2>{reminder.reminderMsg}</h2>
                <h3>Remind Me at:</h3>
                <p>
                  {reminder.remindAt
                    ? new Date(reminder.remindAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                    : "No Reminder Set"}
                </p>
                <div className="button" onClick={() => deleteReminder(reminder._id)}>Delete</div>
              </div>
            ))
          ) : (
            <p>No reminders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
