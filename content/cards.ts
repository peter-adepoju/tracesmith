/**
 * The review deck.
 *
 * One card per idea that is worth knowing cold: the vocabulary an interviewer
 * asks about and the distinctions that cause real mistakes. Cards are added as
 * lessons are written, and the `week` field keeps a card out of the deck until
 * you have reached it.
 */

export type Card = {
  id: string;
  front: string;
  back: string;
  /** First week this card may appear. */
  week: number;
};

export const CARDS: Card[] = [
  {
    id: "dns",
    front: "What does DNS do?",
    back: "Turns a human name like example.com into the IP address a computer can actually connect to. It is the phone book of the internet.",
    week: 1,
  },
  {
    id: "client-server",
    front: "Why can a server never speak first?",
    back: "HTTP is a request-response protocol. The server only ever answers. Anything that looks like the server starting the conversation (a notification, a webhook) is really a separate request going the other way.",
    week: 1,
  },
  {
    id: "method-get",
    front: "What must a GET never do?",
    back: "Change anything. GET is for reading. A GET that creates, updates or deletes is a defect, because browsers, caches and crawlers all assume it is safe to repeat.",
    week: 1,
  },
  {
    id: "method-post-put-patch",
    front: "POST, PUT and PATCH: what is the difference?",
    back: "POST creates or triggers something new. PUT replaces a whole resource. PATCH changes part of one. PUT is repeatable with the same result; POST usually is not.",
    week: 1,
  },
  {
    id: "status-families",
    front: "What do the five status code families mean?",
    back: "1xx informational, 2xx success, 3xx redirect, 4xx the caller got it wrong, 5xx the server failed. The jump from 4xx to 5xx is the jump from your problem to their problem.",
    week: 1,
  },
  {
    id: "401-vs-403",
    front: "401 versus 403?",
    back: "401 means we do not know who you are: no credential, or an unrecognised one. 403 means we know who you are and you are not allowed. 401 is identity, 403 is permission.",
    week: 1,
  },
  {
    id: "404-vs-405",
    front: "404 versus 405?",
    back: "404 means there is nothing at that address. 405 means the address exists but not for that method, for example a GET where only POST is accepted.",
    week: 1,
  },
  {
    id: "400-vs-422",
    front: "400 versus 422?",
    back: "400 usually means the request itself was malformed, for example a body that is not valid JSON. 422 means the body parsed fine but the content failed the server's rules, for example a missing required field.",
    week: 1,
  },
  {
    id: "500-owner",
    front: "You see a 500. Whose problem is it?",
    back: "The server's. Nothing the caller changes will fix it, so stop trying inputs and escalate with the request id, the time and the exact path.",
    week: 1,
  },
  {
    id: "header-content-type",
    front: "What does the Content-Type header tell the server?",
    back: "What format the body is in, for example application/json. Send JSON with the wrong Content-Type and a server will often reject it without ever looking at the body.",
    week: 1,
  },
  {
    id: "header-authorization",
    front: "What goes in the Authorization header, and what must you do before sharing one?",
    back: "The credential proving who is calling, usually a key or a bearer token. Redact it before any screenshot, ticket or message. It is a password.",
    week: 1,
  },
  {
    id: "idempotent",
    front: "What does idempotent mean?",
    back: "Doing it twice has the same effect as doing it once. GET, PUT and DELETE should be idempotent; POST usually is not, which is why a retried payment can charge twice.",
    week: 1,
  },
];

export function cardsUpTo(week: number): Card[] {
  return CARDS.filter((card) => card.week <= week);
}
