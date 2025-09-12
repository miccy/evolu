export interface NavGroup {
  title: string;
  links: Array<{
    title: string;
    href: string;
  }>;
}

export const navigation: Array<NavGroup> = [
  {
    title: "Getting started",
    links: [{ title: "Quickstart", href: "/docs/quickstart" }],
  },
  {
    title: "Library",
    links: [
      {
        title: "Result",
        href: "/docs/api-reference/common/Result/type-aliases/Result",
      },
      { title: "Type", href: "/docs/api-reference/common/Type" },
      { title: "Dependency injection", href: "/docs/dependency-injection" },
      { title: "Conventions", href: "/docs/conventions" },
    ],
  },
  {
    title: "Local-first",
    links: [
      { title: "Overview", href: "/docs/overview" },
      { title: "Playgrounds", href: "/docs/playgrounds" },
      { title: "Examples", href: "/docs/examples" },
      { title: "Indexes", href: "/docs/indexes" },
      { title: "Relay", href: "/docs/evolu-relay" },
      { title: "Time travel", href: "/docs/time-travel" },
      { title: "Migrations", href: "/docs/migrations" },
      { title: "Protocol", href: "/docs/api-reference/common/Evolu/Protocol" },
      { title: "Privacy", href: "/docs/privacy" },
      { title: "FAQ", href: "/docs/faq" },
    ],
  },
  {
    title: "Other",
    links: [
      { title: "API reference", href: "/docs/api-reference" },
      { title: "Comparison", href: "/docs/comparison" },
      { title: "Showcase", href: "/docs/showcase" },
      { title: "Changelog", href: "https://github.com/evoluhq/evolu/releases" },
    ],
  },
];
