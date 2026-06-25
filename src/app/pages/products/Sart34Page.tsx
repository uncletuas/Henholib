import { ExternalRedirect } from "../../components/ExternalRedirect";
import { SART34_URL } from "../../config/site";

// SART34 has its own landing page on sart34.loopital.com. We don't host a
// separate page here — this legacy route just forwards visitors to it.
export function Sart34Page() {
  return <ExternalRedirect to={SART34_URL} name="SART34" />;
}
