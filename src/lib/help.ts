export const HELP_CATEGORIES = [
  "A page won't load",
  "The theme or hero image looks wrong",
  "Problem with the cart or checkout",
  "Problem with my profile",
  "Something else",
] as const;

export const HELP_PAGES = [
  "Home", "Shop", "Cart", "Checkout", "Profile", "Portfolio", "About", "Help", "Not sure",
] as const;

export const HELP_SEVERITIES = [
  { value: "minor", label: "It's an annoyance, but I can carry on" },
  { value: "blocking", label: "It stops me from doing what I came to do" },
] as const;
