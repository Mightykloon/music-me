import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of Remixd, including your content, acceptable use, copyright policy, and account rules.",
};

const LAST_UPDATED = "July 2, 2026";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] tracking-tight"
          >
            remix<span className="text-primary">d</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="space-y-3 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] tracking-tighter">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed text-muted-foreground">
          <Section title="1. Acceptance of These Terms">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) are a binding
              agreement between you and Remixd (&ldquo;Remixd,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              governing your use of our website, applications, and related
              services (collectively, the &ldquo;Service&rdquo;). Remixd is a
              music and file-sharing community platform where you can build a
              customizable profile, import playlists, share posts and audio,
              and participate in community forums.
            </p>
            <p>
              By creating an account or using the Service, you agree to these
              Terms and to our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 13 years old (or the minimum age required in
              your jurisdiction) to use the Service. If you are under the age of
              majority where you live, you may use the Service only with the
              consent of a parent or legal guardian. By using the Service, you
              represent that you meet these requirements.
            </p>
          </Section>

          <Section title="3. Your Account">
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                You are responsible for the accuracy of the information you
                provide and for all activity that occurs under your account.
              </li>
              <li>
                Keep your password secure. Notify us promptly if you suspect
                unauthorized access to your account.
              </li>
              <li>
                You may not impersonate another person, use a misleading
                username, or transfer your account without our consent.
              </li>
            </ul>
          </Section>

          <Section title="4. Your Content">
            <p>
              &ldquo;Content&rdquo; means anything you post, upload, share, or
              store on the Service — including text, images, audio files,
              playlists, lyric cards, polls, forum posts, messages, and profile
              customizations.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">You own your Content.</strong>{" "}
                These Terms do not transfer ownership of anything you create.
              </li>
              <li>
                <strong className="text-foreground">License to us:</strong> by
                posting Content, you grant Remixd a worldwide, non-exclusive,
                royalty-free license to host, store, reproduce, display,
                distribute, and adapt (for technical purposes such as
                transcoding or thumbnails) your Content, solely as needed to
                operate, promote, and improve the Service. This license ends
                when you delete the Content or your account, except where the
                Content has been shared with others who have not deleted it, or
                where retention is required by law.
              </li>
              <li>
                <strong className="text-foreground">Your responsibility:</strong>{" "}
                you represent that you have all rights necessary to post your
                Content and that it does not violate these Terms or any law.
              </li>
              <li>
                <strong className="text-foreground">Visibility:</strong> Content
                is visible to others according to the visibility settings you
                choose. Public Content may be viewed, shared, and interacted
                with by other users.
              </li>
            </ul>
          </Section>

          <Section title="5. Copyright & DMCA Policy">
            <p>
              Remixd is a community for sharing music you have the right to
              share — your own work, remixes you are licensed to distribute, and
              content in the public domain or under permissive licenses.
              Uploading or distributing copyrighted works without authorization
              is prohibited.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                We respond to notices of alleged copyright infringement
                consistent with the Digital Millennium Copyright Act (DMCA).
              </li>
              <li>
                If you believe Content on the Service infringes your copyright,
                send a notice to{" "}
                <a
                  href="mailto:damian@nullberry.dev"
                  className="text-primary hover:underline"
                >
                  damian@nullberry.dev
                </a>{" "}
                including: identification of the copyrighted work, the location
                (URL) of the infringing material, your contact information, a
                good-faith statement that the use is unauthorized, a statement
                under penalty of perjury that the notice is accurate and you are
                authorized to act, and your physical or electronic signature.
              </li>
              <li>
                If your Content was removed and you believe this was a mistake,
                you may submit a counter-notice to the same address.
              </li>
              <li>
                We will terminate the accounts of repeat infringers.
              </li>
            </ul>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                Upload or share content that is illegal, infringing, hateful,
                harassing, sexually exploitative, or that incites violence;
              </li>
              <li>
                Distribute malware, spam, or deceptive links, or attempt to
                phish or defraud other users;
              </li>
              <li>
                Access accounts or data that do not belong to you, probe or
                circumvent security measures, or interfere with the operation of
                the Service;
              </li>
              <li>
                Scrape, harvest, or bulk-collect user data without our written
                permission;
              </li>
              <li>
                Use the Service to violate the terms of a connected third-party
                service (e.g., Spotify, Apple Music, SoundCloud); or
              </li>
              <li>
                Misrepresent your identity or affiliation with any person or
                entity.
              </li>
            </ul>
            <p className="mt-3">
              We may remove Content or restrict, suspend, or terminate accounts
              that violate these Terms, at our discretion.
            </p>
          </Section>

          <Section title="7. Connected Third-Party Services">
            <p>
              The Service lets you connect third-party music and login providers
              (Google, Spotify, Apple Music, YouTube Music, Last.fm, Deezer,
              SoundCloud). Your use of those services is governed by their own
              terms and policies. We are not responsible for third-party
              services, and features that depend on them may change or stop
              working if the provider changes or revokes access.
            </p>
          </Section>

          <Section title="8. Remixd's Intellectual Property">
            <p>
              The Service itself — including its software, design, wordmark, and
              branding — is owned by Remixd or its licensors and is protected by
              intellectual-property laws. Except for the rights expressly
              granted to you in these Terms, we reserve all rights. You may not
              copy, modify, or create derivative works of the Service, or
              reverse-engineer it except where the law permits.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              You may stop using the Service or delete your account at any time.
              We may suspend or terminate your access if you violate these
              Terms, if required by law, or if we discontinue the Service.
              Sections that by their nature should survive termination (such as
              content licenses for shared content, disclaimers, and limitations
              of liability) survive.
            </p>
          </Section>

          <Section title="10. Disclaimers">
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
              AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
              OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
              THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT
              CONTENT POSTED BY USERS IS ACCURATE OR LAWFUL.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, REMIXD WILL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM
              OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY
              CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT EXCEED
              THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS
              BEFORE THE CLAIM AROSE OR (B) US $100. Some jurisdictions do not
              allow certain limitations, so some of the above may not apply to
              you.
            </p>
          </Section>

          <Section title="12. Indemnification">
            <p>
              You agree to indemnify and hold Remixd harmless from claims,
              damages, and expenses (including reasonable attorneys&rsquo; fees)
              arising from your Content, your use of the Service, or your
              violation of these Terms or of any third party&rsquo;s rights.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              We may update these Terms from time to time. When we make material
              changes, we will update the &ldquo;Last updated&rdquo; date above
              and, where appropriate, provide additional notice. Your continued
              use of the Service after changes take effect constitutes
              acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              Questions about these Terms? Contact us at{" "}
              <a
                href="mailto:damian@nullberry.dev"
                className="text-primary hover:underline"
              >
                damian@nullberry.dev
              </a>
              .
            </p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            remix<span className="text-primary">d</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24 space-y-3">
      <h2 className="text-xl sm:text-2xl font-semibold font-[family-name:var(--font-space-grotesk)] text-foreground tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
