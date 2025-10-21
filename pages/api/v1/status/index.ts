import type { NextApiRequest, NextApiResponse } from "next";

export default function status(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    message: "A princípio tudo ok",
  });
}
