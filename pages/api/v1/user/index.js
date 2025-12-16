import { createRouter } from "next-connect";

import controller from "infra/controller";
import session from "models/session";
import user from "models/user";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionFound = await session.findOneValidByToken(sessionToken);
  const renewedSession = await session.renew(sessionFound.id);
  const userFound = await user.findOneById(sessionFound.user_id);

  controller.createSessionCookie(renewedSession.token, res);
  controller.disableCacheControl(res);

  res.status(200).json(userFound);
}
