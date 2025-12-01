import type { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";

import controller from "infra/controller";
import user from "models/user";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(postHandler);

export default router.handler(controller.errorHandler);

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const userInputValues = req.body;
  const newUser = await user.create(userInputValues);

  res.status(201).json(newUser);
}
