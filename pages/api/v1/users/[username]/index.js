import { createRouter } from "next-connect";

import controller from "infra/controller";
import user from "models/user";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const username = req.query.username;
  const userFound = await user.findOneByUsername(username);

  res.status(200).json(userFound);
}

async function patchHandler(req, res) {
  const username = req.query.username;
  const userInputValues = req.body;
  const updatedUser = await user.update(username, userInputValues);

  res.status(200).json(updatedUser);
}
