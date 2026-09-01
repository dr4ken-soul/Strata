"""HTML to text extraction by heading path."""

from __future__ import annotations

from bs4 import BeautifulSoup


def extract_sections(html: str) -> dict[str, str]:
    """Extracts text per section from rendered HTML, keyed by heading path.
    A heading path looks like "Docs / Tokenomics / Emissions" so sections match
    across captures by structure rather than by position.
    @param html - the raw rendered HTML of one capture
    @returns an ordered mapping of heading path to section text
    """
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    headings = soup.find_all(["h1", "h2", "h3"])
    sections: dict[str, str] = {}
    if not headings:
        text = soup.get_text(" ", strip=True)
        if text:
            sections["/"] = text
        return sections

    trail: list[tuple[int, str]] = []
    body_text_before = soup.get_text(" ", strip=True)
    if body_text_before:
        sections["/"] = body_text_before

    for heading in headings:
        level = int(heading.name[1])
        title = heading.get_text(" ", strip=True)
        while trail and trail[-1][0] >= level:
            trail.pop()
        trail.append((level, title))
        path = " / ".join(t for _, t in trail)
        parts: list[str] = []
        node = heading
        while node is not None:
            node = node.next_sibling
            if node is None:
                break
            if getattr(node, "name", None) in ("h1", "h2", "h3"):
                break
            text = node.get_text(" ", strip=True) if hasattr(node, "get_text") else str(node).strip()
            if text:
                parts.append(text)
        sections[path] = " ".join(parts)
    return sections
