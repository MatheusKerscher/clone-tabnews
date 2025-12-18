import email from "infra/email";
import orchestrator from "tests/orchestrator";

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Send Test <send.test@email.com>",
      to: "recive.test@email.com",
      subject: "Hello from Tests",
      text: "This message was sent from a test.",
    });

    await email.send({
      from: "Send Test <send.test@email.com>",
      to: "recive.test@email.com",
      subject: "Last email",
      text: "This is the body of last email.",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<send.test@email.com>");
    expect(lastEmail.recipients[0]).toBe("<recive.test@email.com>");
    expect(lastEmail.subject).toBe("Last email");
    expect(lastEmail.text).toBe("This is the body of last email.\n");
  });
});
