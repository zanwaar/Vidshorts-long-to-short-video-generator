import { serve } from "inngest/next";

import { inngestFunctions } from "@/app/api/inngest/functions";
import { inngest } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
