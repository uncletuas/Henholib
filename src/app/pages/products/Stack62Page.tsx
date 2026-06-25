import { ExternalRedirect } from "../../components/ExternalRedirect";
import { STACK62_URL } from "../../config/site";

// STACK62 has its own landing page on stack62.loopital.com. We don't host a
// separate page here — this legacy route just forwards visitors to it.
export function Stack62Page() {
  return <ExternalRedirect to={STACK62_URL} name="STACK62" />;
}
