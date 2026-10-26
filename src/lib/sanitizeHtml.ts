import DOMPurify from "isomorphic-dompurify";

/**
 * Nettoie le HTML de la description d'une fiche professionnelle (éditeur de
 * texte riche Tiptap, voir RichTextEditor.tsx) avant tout enregistrement en
 * base. Le HTML produit par l'éditeur en usage normal est déjà sûr, mais
 * cette valeur arrive telle quelle depuis le corps de la requête API — un
 * appel direct (en contournant le formulaire) pourrait y injecter du HTML
 * arbitraire, affiché ensuite sans échappement (`dangerouslySetInnerHTML`)
 * sur la fiche publique et le tableau de bord.
 *
 * La liste de balises/attributs autorisés correspond exactement aux
 * extensions Tiptap configurées (StarterKit, Underline, TextAlign, Link) —
 * tout le reste (scripts, gestionnaires d'événements, iframes, styles
 * arbitraires...) est retiré.
 */
export function sanitizeDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s", "strike",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "a", "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  });
}
