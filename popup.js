function updateQuestionList() {
  chrome.storage.local.get({questions: []}, function(data) {
    let questionList = document.getElementById('questionList');
    questionList.innerHTML = '';
    data.questions.forEach(function(question, index) {
      let li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';

      let textSpan = document.createElement('span');
      textSpan.textContent = question;

      let deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.style.marginLeft = 'auto';
      deleteButton.addEventListener('click', function() {
        chrome.storage.local.get({questions: []}, function(data) {
          let questions = data.questions;
          questions.splice(index, 1); 
          chrome.storage.local.set({questions: questions}, function() {
            updateQuestionList();
          });
        });
      });

      textSpan.addEventListener('click', function() {
        navigator.clipboard.writeText(question).then(function() {
          let message = document.createElement('span');
          message.textContent = 'Copied!';
          li.appendChild(message);
          setTimeout(function() {
            li.removeChild(message);
          }, 1000);
        }, function(err) {
          console.error('Failed to copy: ', err);
        });
      });

      li.appendChild(textSpan);
      li.appendChild(deleteButton);
      questionList.appendChild(li);
    });
  });
}

document.getElementById('saveButton').addEventListener('click', function() {
  let question = document.getElementById('questionInput').value;
  chrome.storage.local.get({questions: []}, function(data) {
    let questions = data.questions;
    questions.push(question);
    chrome.storage.local.set({questions: questions}, function() {
      updateQuestionList();
      document.getElementById('questionInput').value = '';
    });
  });
});

const backupButton = document.createElement('button');
backupButton.textContent = 'Export';
backupButton.addEventListener('click', function() {
  chrome.storage.local.get({questions: []}, function(data) {
    const questions = data.questions;
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'note_chrome_backup.json'; 
    a.click();

    URL.revokeObjectURL(url);
  });
});
document.body.appendChild(backupButton);

const restoreButton = document.createElement('button');
restoreButton.textContent = 'Import';
restoreButton.addEventListener('click', function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedQuestions = JSON.parse(e.target.result);
          if (Array.isArray(importedQuestions)) {
            chrome.storage.local.set({questions: importedQuestions}, function() {
              updateQuestionList();
              alert('Backup restored successfully!');
            });
          } else {
            alert('Invalid backup file format.');
          }
        } catch (error) {
          alert('Failed to import backup: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  });
  input.click();
});
document.body.appendChild(restoreButton);

updateQuestionList();
