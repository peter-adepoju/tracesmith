import type { Metadata } from "next";
import { RequestInspector } from "@/components/RequestInspector";
import { PUBLIC_KEY, SECRET_KEY } from "@/lib/mockApi";

export const metadata: Metadata = { title: "Sandbox" };

export default function SandboxPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sandbox</h1>
      <p className="mt-2 text-muted">
        A fake API that runs entirely in this page. Nothing leaves your
        computer, nothing costs money, and nothing can break. Use it to practise
        reading requests the way you will read them in DevTools.
      </p>

      <section className="prose mt-8">
        <h2>The endpoints</h2>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Key</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET</td>
              <td>
                <code>/v1/ping</code>
              </td>
              <td>none</td>
              <td>Health check</td>
            </tr>
            <tr>
              <td>POST</td>
              <td>
                <code>/v1/payments/initiate</code>
              </td>
              <td>public</td>
              <td>Starts a payment, returns a checkout link</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>
                <code>/v1/payments/verify/:reference</code>
              </td>
              <td>secret</td>
              <td>
                Confirms a payment. Try <code>ORDER-1001</code>,{" "}
                <code>ORDER-1002</code>, <code>ORDER-1003</code>
              </td>
            </tr>
            <tr>
              <td>GET</td>
              <td>
                <code>/v1/customers</code>
              </td>
              <td>secret</td>
              <td>Lists customers</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>
                <code>/v1/customers/:id</code>
              </td>
              <td>secret</td>
              <td>
                One customer. Try <code>cus_01</code>
              </td>
            </tr>
            <tr>
              <td>GET</td>
              <td>
                <code>/v1/boom</code>
              </td>
              <td>any</td>
              <td>Always fails with a 500, on purpose</td>
            </tr>
          </tbody>
        </table>

        <h2>The keys</h2>
        <p>
          These are invented and work only here. Treat them as if they were
          real: the public key may appear in a browser, the secret key never may.
        </p>
        <pre>
          <code>
            {`public  ${PUBLIC_KEY}
secret  ${SECRET_KEY}`}
          </code>
        </pre>
      </section>

      <RequestInspector />

      <section className="prose mt-6">
        <h2>Things worth trying</h2>
        <ol>
          <li>Send a request with no key, then the same one with the secret key.</li>
          <li>
            Call <code>/v1/payments/initiate</code> with the secret key and read
            why it is refused.
          </li>
          <li>
            Verify <code>ORDER-1002</code> and explain, from the response alone,
            why the customer has not been charged.
          </li>
          <li>
            Break the JSON body on purpose and compare the 400 with the 422.
          </li>
          <li>
            Call <code>/v1/boom</code> and look at the Timing tab. Who would you
            escalate this to?
          </li>
        </ol>
      </section>
    </main>
  );
}
