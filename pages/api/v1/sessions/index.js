import { createRouter } from "next-connect";

import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser)
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandler);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro."
    })
  }

  const createdSession = await session.create(authenticatedUser.id);
  controller.createSessionCookie(createdSession.token, res);

  const secureOutputValues = authorization.filterOutput(authenticatedUser, "read:session", createdSession)

  res.status(201).json(secureOutputValues);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionFound = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionFound.id);

  controller.clearSessionCookie(res);

  const userTryingToDelete = req.context.user
  const secureOutputValues = authorization.filterOutput(userTryingToDelete, "read:session", expiredSession)

  res.status(200).json(secureOutputValues);
}
