import { redirect } from "next/navigation";

// The API docs page exposed internal infrastructure details (CDN URLs, widget IDs,
// scraping patterns). Redirect to home in all environments.
export default function DocsPage() {
  redirect("/");
}
