import { createRouter } from "next-connect";

import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

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

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionFound = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionFound.id);

  controller.clearSessionCookie(res);
  res.status(200).json(expiredSession);
}
