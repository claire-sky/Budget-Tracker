let db;

const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// executed if a new transaction is submitted and there's no internet connection
function saveRecord(record) {
  const transaction = db.transaction(["new_transaction"], "readwrite");
  const transactionObjectStore = transaction.objectStore("new_transaction");

  transactionObjectStore.add(record);
}

function uploadTransaction() {
  // open a transaction on db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access object store
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // get all records from store and set to a variable
  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function () {
    // send any data in indexedDb's store to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the new_transaction object store
          const transactionObjectStore =
            transaction.objectStore("new_transaction");
          // clear all items in store
          transactionObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadTransaction);
