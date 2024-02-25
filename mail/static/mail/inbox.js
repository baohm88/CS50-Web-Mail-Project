document.addEventListener("DOMContentLoaded", function () {
    // Use buttons to toggle between views
    document
        .querySelector("#inbox")
        .addEventListener("click", () => load_mailbox("inbox"));
    document
        .querySelector("#sent")
        .addEventListener("click", () => load_mailbox("sent"));
    document
        .querySelector("#archived")
        .addEventListener("click", () => load_mailbox("archive"));
    document.querySelector("#compose").addEventListener("click", compose_email);

    // Submit handler
    document
        .querySelector("#compose-form")
        .addEventListener("submit", send_email);

    // By default, load the inbox
    load_mailbox("inbox");
});


function compose_email() {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";
    document.querySelector("#email-detail-view").style.display = "none";

    // Clear out composition fields
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
}


function view_email(id) {
    // Get selected email based on its id
    fetch(`/emails/${id}`)
        .then((response) => response.json())
        .then((email) => {
            // Hide emails-view and compose-view
            document.querySelector("#emails-view").style.display = "none";
            document.querySelector("#compose-view").style.display = "none";
            document.querySelector("#email-detail-view").style.display = "block";

            // Show email details
            document.querySelector("#email-detail-view").innerHTML = `
                <ul class="list-group">
                    <li class="list-group-item">
                    <p><strong>From:</strong> ${email.sender}</p>
                    <p><strong>To:</strong> ${email.recipients}</p>
                    <p><strong>Subject:</strong> ${email.subject}</p>
                    <p><strong>Timestamp:</strong> ${email.timestamp}</p>
                    </li>
                    <li class="list-group-item">${email.body}</li>
                </ul>
            `;

            // change email background to gray if read
            if (!email.read) {
                fetch(`/emails/${email.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        read: true,
                    }),
                });
            }

            // Create Archive/Unarchive button
            const btn_archive = document.createElement("button");
            // Toggle Archive/Unarchive button
            btn_archive.innerHTML = email.archived ? "Unarchive" : "Archive";
            // Set button collor
            btn_archive.className = email.archived
                ? "btn btn-sm btn-success mt-3"
                : "btn btn-sm btn-danger mt-3";
            // Update archived status
            btn_archive.addEventListener("click", function () {
                fetch(`/emails/${email.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        archived: !email.archived,
                    }),
                }).then(() => {
                    // Load Inbox mailbox
                    load_mailbox("inbox");
                });
            });
            document.querySelector("#email-detail-view").append(btn_archive);

            // Creat Reply button
            const btn_reply = document.createElement("button");
            btn_reply.innerHTML = "Reply";
            btn_reply.className = "btn btn-sm btn-info mt-3 mx-3";
            btn_reply.addEventListener("click", function () {
                compose_email();

                // Pre-fill composition fields
                document.querySelector("#compose-recipients").value =
                    email.sender;
                let subject = email.subject;
                // Add "Re:" only once to subject line
                if (subject.split(" ", 1)[0] != "Re:") {
                    subject = "Re: " + email.subject;
                }
                document.querySelector("#compose-subject").value = subject;
                document.querySelector(
                    "#compose-body"
                ).value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
            });
            document.querySelector("#email-detail-view").append(btn_reply);
        });
}


function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-detail-view").style.display = "none";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3>${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

    // Get emails for the selected mailbox and user
    fetch(`/emails/${mailbox}`)
        .then((response) => response.json())
        .then((emails) => {
            // Loop through emails
            emails.forEach((email) => {
        
                // Create a row for each email
                const newEmail = document.createElement("div");
                // Toggle between read/unread email
                newEmail.className = email.read
                    ? "d-flex justify-content-between border rounded mb-3 read"
                    : "d-flex justify-content-between border rounded mb-3 unread";
                // Render email in its own box
                newEmail.innerHTML = `
                    <div class="p-2"> <strong>${email.sender}</strong></div>
                    <div class="p-2">${email.subject}</div>
                    <div class="p-2">${email.timestamp}</div>
                `;

                // Add click event to view email
                newEmail.addEventListener("click", () => {
                    view_email(email.id);
                });
                // Append email to show on top of the page
                document.querySelector("#emails-view").append(newEmail);
            });
        });
}


function send_email(event) {
    event.preventDefault();

    // Store submitted form data
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    // Send email to DB
    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
        }),
    })
        .then((response) => response.json())
        .then((result) => {

            // Load user's sent mailbox
            load_mailbox("sent");
        });
}
