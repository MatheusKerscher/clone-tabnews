import { createRouter } from "next-connect";

import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandler);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );
  const createdSession = await session.create(authenticatedUser.id);

  controller.createSessionCookie(createdSession.token, res);

  res.status(201).json(createdSession);
}
