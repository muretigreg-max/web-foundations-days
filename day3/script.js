let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];
function searchNotes(word) {
  return notes.filter((note) =>
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}
function countByCategory() {
  let counts = {};

  for (let note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();

  return notes.some(
    (note) => note.text.trim().toLowerCase() === cleanedText
  );
}
function addNote(text, category) {
  const cleanedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (cleanedText.length < 1 || cleanedText.length > 200) {
    console.log("Note must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(cleanedText)) {
    console.log("Note already exists.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category.");
    return false;
  }

  const newNote = {
    id: notes.length + 1,
    text: cleanedText,
    category: category,
  };

  notes.push(newNote);

  return true;
}
// searchNotes
console.log(searchNotes("javascript")); // Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("pizza")); // Expected: []

// longestNote
console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
console.log(searchNotes("")); // Expected: all 5 notes

// countByCategory
console.log(countByCategory()); // Expected: { personal: 2, study: 2, work: 1 }
console.log(addNote("Read a book", "personal")); // Expected: true

// getSummary
console.log(getSummary()); // Expected: 6 notes: 3 personal, 1 work, 2 study.
console.log(addNote("New note", "invalid")); // Expected: false

// isDuplicate
console.log(isDuplicate("Call mum")); // Expected: true
console.log(isDuplicate("  CALL MUM  ")); // Expected: true

// addNote
console.log(addNote("Buy a notebook", "study")); // Expected: true
console.log(addNote("Buy milk and bread", "personal")); // Expected: false
console.log(searchNotes("javascript")); // Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("pizza")); // Expected: []
console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

notes = [];
console.log(longestNote()); // Expected: null
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];
console.log(countByCategory()); // Expected: { personal: 2, study: 2, work: 1 }

notes = [];
console.log(countByCategory()); // Expected: {}
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];
console.log(getSummary()); // Expected: 5 notes: 2 personal, 1 work, 2 study.

notes = [];
console.log(getSummary()); // Expected: 0 notes: 0 personal, 0 work, 0 study.
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];
console.log(isDuplicate("Call mum")); // Expected: true
console.log(isDuplicate("  CALL MUM  ")); // Expected: true
console.log(addNote("Buy a notebook", "study")); // Expected: true
console.log(addNote("Buy milk and bread", "personal")); // Expected: false
console.log(addNote("", "personal")); // Expected: false
console.log(addNote("Study JavaScript", "hobby")); // Expected: false
