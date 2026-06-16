import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How music.me collects, uses, stores, and protects your personal data, and the rights you have over it.",
};

const LAST_UPDATED = "June 16, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] tracking-tight"
          >
            music<span className="text-primary">.me</span>
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="prose-policy space-y-10 text-[15px] leading-relaxed text-muted-foreground">
          <Section title="1. Introduction">
            <p>
              This Privacy Policy explains how music.me (&ldquo;music.me,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
              uses, discloses, retains, and protects information about you when
              you use our website, applications, and related services
              (collectively, the &ldquo;Service&rdquo;). music.me is a
              music-based social platform that lets you build a customizable
              profile, import playlists from streaming services, share posts and
              lyric cards, participate in forums, and connect with other
              listeners.
            </p>
            <p>
              By creating an account or otherwise using the Service, you
              acknowledge that you have read and understood this Policy. If you
              do not agree with it, please do not use the Service.
            </p>
          </Section>

          <Section title="2. Who Is Responsible for Your Data">
            <p>
              music.me is the data controller for the personal data processed
              through the Service. For privacy questions, requests, or
              complaints, contact us using the details in the{" "}
              <a href="#contact" className="text-primary hover:underline">
                Contact Us
              </a>{" "}
              section below.
            </p>
          </Section>

          <Section title="3. Information We Collect">
            <p>
              We collect the following categories of information. We have tried
              to be exhaustive so you know exactly what is stored.
            </p>

            <h3 className="text-foreground font-semibold mt-6 mb-2">
              3.1 Information you provide directly
            </h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">Account data:</strong> email
                address, username, and (for email/password accounts) a securely
                hashed password. We never store your password in plain text.
              </li>
              <li>
                <strong className="text-foreground">Profile data:</strong>{" "}
                display name, bio, pronouns, location, website link, profile and
                banner images, background images or video, and your chosen
                colors, fonts, layout style, custom CSS, vibe board, and profile
                song.
              </li>
              <li>
                <strong className="text-foreground">
                  Content you create:
                </strong>{" "}
                posts (text, images, polls, lyric cards, playlist drops, and
                &ldquo;now playing&rdquo; cards), comments, reactions, forum
                threads and replies (including any audio you upload), and direct
                messages you send to other users.
              </li>
              <li>
                <strong className="text-foreground">Social graph:</strong> the
                accounts you follow and that follow you, and your interactions
                with other users&rsquo; content.
              </li>
              <li>
                <strong className="text-foreground">
                  Communications with us:
                </strong>{" "}
                information you provide when you contact support or otherwise
                correspond with us.
              </li>
            </ul>

            <h3 className="text-foreground font-semibold mt-6 mb-2">
              3.2 Information from connected music & login services
            </h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">OAuth tokens:</strong> when
                you connect a third-party account (Google, Spotify, Apple Music,
                YouTube Music, Last.fm, Deezer, or SoundCloud), we store the
                access and refresh tokens needed to act on your behalf. These
                tokens are encrypted at rest.
              </li>
              <li>
                <strong className="text-foreground">
                  Provider profile identifiers:
                </strong>{" "}
                the provider&rsquo;s user ID and username, the scopes you
                granted, and token expiry times.
              </li>
              <li>
                <strong className="text-foreground">Music data:</strong>{" "}
                playlists, tracks, album artwork, preview URLs, synced lyrics,
                and your currently-playing track, as made available by the
                connected service.
              </li>
            </ul>

            <h3 className="text-foreground font-semibold mt-6 mb-2">
              3.3 Information collected automatically
            </h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">
                  Authentication &amp; session data:
                </strong>{" "}
                session tokens and cookies that keep you logged in and secure
                your session.
              </li>
              <li>
                <strong className="text-foreground">
                  Technical &amp; log data:
                </strong>{" "}
                information your browser or device sends automatically, such as
                IP address, device and browser type, and timestamps, used for
                security, abuse prevention, and to operate the Service.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> the
                pages you view and the actions you take within the Service.
              </li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Create and maintain your account and profile;</li>
              <li>
                Provide core features — feeds, posts, messaging, forums,
                playlist import, lyrics, and music search;
              </li>
              <li>
                Authenticate you and connect your music and login services on
                your behalf;
              </li>
              <li>
                Deliver notifications about follows, reactions, comments,
                reposts, mentions, and messages;
              </li>
              <li>
                Personalize your experience and surface relevant people and
                content;
              </li>
              <li>
                Maintain the security and integrity of the Service, prevent
                fraud and abuse, and enforce our terms;
              </li>
              <li>
                Diagnose problems, debug, and improve the Service; and
              </li>
              <li>Comply with legal obligations.</li>
            </ul>
          </Section>

          <Section title="5. Legal Bases for Processing (EEA/UK Users)">
            <p>
              If you are in the European Economic Area or the United Kingdom, we
              process your personal data under one or more of the following
              legal bases:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">Contract:</strong>{" "}
                processing necessary to provide the Service you signed up for;
              </li>
              <li>
                <strong className="text-foreground">Consent:</strong> where you
                connect a third-party service or otherwise opt in (you may
                withdraw consent at any time);
              </li>
              <li>
                <strong className="text-foreground">
                  Legitimate interests:
                </strong>{" "}
                operating, securing, and improving the Service, where not
                overridden by your rights; and
              </li>
              <li>
                <strong className="text-foreground">Legal obligation:</strong>{" "}
                where processing is required to comply with the law.
              </li>
            </ul>
          </Section>

          <Section title="6. How We Share Information">
            <p>
              We do not sell your personal data. We share information only as
              described below.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">
                  With other users:
                </strong>{" "}
                your profile, posts, comments, forum activity, and public
                interactions are visible to others according to the visibility
                settings you choose (public, followers-only, or private).
                Direct messages are visible to the participants of the
                conversation.
              </li>
              <li>
                <strong className="text-foreground">
                  With connected services:
                </strong>{" "}
                when you link a music or login provider, we exchange data with
                that provider as needed to deliver the feature. Their handling
                of your data is governed by their own privacy policies.
              </li>
              <li>
                <strong className="text-foreground">
                  With service providers:
                </strong>{" "}
                we use trusted vendors that process data on our behalf, such as
                our database host (Neon), and, where configured, cloud object
                storage (Amazon Web Services) and caching infrastructure. These
                providers are bound by contractual confidentiality and
                security obligations.
              </li>
              <li>
                <strong className="text-foreground">
                  For legal reasons:
                </strong>{" "}
                we may disclose information if required by law, legal process, or
                to protect the rights, property, or safety of music.me, our
                users, or the public.
              </li>
              <li>
                <strong className="text-foreground">
                  Business transfers:
                </strong>{" "}
                if music.me is involved in a merger, acquisition, or sale of
                assets, your information may be transferred as part of that
                transaction, subject to this Policy.
              </li>
            </ul>
          </Section>

          <Section title="7. Third-Party Services">
            <p>
              The Service integrates with the following third parties. We
              encourage you to review their privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">
                  Login &amp; music providers:
                </strong>{" "}
                Google, Spotify, Apple Music, YouTube Music, Last.fm, Deezer,
                and SoundCloud.
              </li>
              <li>
                <strong className="text-foreground">
                  Music search:
                </strong>{" "}
                the Apple iTunes Search API, used as a default search source
                that does not require you to connect an account.
              </li>
              <li>
                <strong className="text-foreground">Infrastructure:</strong>{" "}
                Neon (serverless PostgreSQL database) and, where enabled, Amazon
                Web Services (media storage) and Redis (caching).
              </li>
            </ul>
          </Section>

          <Section title="8. Cookies and Similar Technologies">
            <p>
              We use cookies and similar technologies that are strictly
              necessary to operate the Service — primarily to keep you signed in
              and to protect the security of your session. Because these cookies
              are essential to the functioning of the Service, disabling them in
              your browser may prevent you from logging in or using core
              features.
            </p>
          </Section>

          <Section title="9. Data Retention">
            <p>
              We retain your personal data for as long as your account is active
              or as needed to provide the Service. When you delete your account,
              we delete or anonymize your personal data, except where we are
              required to retain it to comply with legal obligations, resolve
              disputes, or enforce our agreements. Some residual copies may
              persist in backups for a limited period before they are
              overwritten.
            </p>
          </Section>

          <Section title="10. Data Security">
            <p>
              We implement technical and organizational measures designed to
              protect your information, including hashing of passwords,
              encryption of third-party access and refresh tokens at rest,
              encrypted connections (HTTPS), and access controls. No method of
              transmission or storage is completely secure, however, and we
              cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="11. International Data Transfers">
            <p>
              We and our service providers may process and store your
              information in countries other than your own, including the United
              States. Where we transfer personal data internationally, we take
              steps to ensure an adequate level of protection consistent with
              applicable law.
            </p>
          </Section>

          <Section title="12. Your Privacy Rights">
            <p>
              Depending on where you live, you may have some or all of the
              following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the personal data we hold about you;</li>
              <li>Correct inaccurate or incomplete data;</li>
              <li>Delete your data;</li>
              <li>
                Restrict or object to certain processing, including direct
                marketing;
              </li>
              <li>
                Data portability — receive your data in a portable format;
              </li>
              <li>Withdraw consent where processing is based on consent; and</li>
              <li>
                Lodge a complaint with a data protection authority.
              </li>
            </ul>
            <p className="mt-3">
              You can exercise many of these rights directly in your account
              settings — for example, editing your profile, managing connected
              services, or deleting content. For any request we cannot fulfill
              in-app, contact us using the details below. We will not
              discriminate against you for exercising your privacy rights.
            </p>

            <h3 className="text-foreground font-semibold mt-6 mb-2">
              12.1 California residents (CCPA/CPRA)
            </h3>
            <p>
              If you are a California resident, you have the right to know what
              personal information we collect, the right to request deletion,
              the right to correct inaccurate information, and the right to
              opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of
              personal information. We do not sell your personal information.
            </p>
          </Section>

          <Section title="13. Children's Privacy">
            <p>
              The Service is not directed to children under the age of 13 (or
              the minimum age required in your jurisdiction), and we do not
              knowingly collect personal data from them. If you believe a child
              has provided us with personal data, please contact us and we will
              take steps to delete it.
            </p>
          </Section>

          <Section title="14. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make
              material changes, we will update the &ldquo;Last updated&rdquo;
              date above and, where appropriate, provide additional notice. Your
              continued use of the Service after changes take effect constitutes
              acceptance of the revised Policy.
            </p>
          </Section>

          <Section title="15. Contact Us" id="contact">
            <p>
              If you have questions about this Privacy Policy or wish to exercise
              your privacy rights, contact us at{" "}
              <a
                href="mailto:privacy@music.me"
                className="text-primary hover:underline"
              >
                privacy@music.me
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
            music<span className="text-primary">.me</span>
          </Link>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl sm:text-2xl font-semibold font-[family-name:var(--font-space-grotesk)] text-foreground tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
