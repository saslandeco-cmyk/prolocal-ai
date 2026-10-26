import sanitizeHtml from "sanitize-html";

/**
 * Nettoie le HTML de la description d'une fiche professionnelle (éditeur de
 * texte riche Tiptap, voir RichTextEditor.tsx) avant tout enregistrement en
 * base. Le HTML produit par l'éditeur en usage normal est déjà sûr, mais
 * cette valeur arrive telle quelle depuis le corps de la requête API — un
 * appel direct (en contournant le formulaire) pourrait y injecter du HTML
 * arbitraire, affiché ensuite sans échappement (`dangerouslySetInnerHTML`)
 * sur la fiche publique et le tableau de bord.
 *
 * ⚠️ Utilise `sanitize-html` (parseur pur JavaScript, htmlparser2) plutôt que
 * `isomorphic-dompurify`/jsdom : ce dernier a fait planter cette route API en
 * production (fonction serverless Vercel) alors qu'il fonctionnait en local —
 * jsdom est une dépendance lourde avec des soucis de compatibilité connus
 * dans certains environnements serverless. `sanitize-html` n'a aucune
 * dépendance native et est largement utilisé en production sur ce type
 * d'environnement.
 *
 * La liste de balises/attributs autorisés correspond exactement aux
 * extensions Tiptap configurées (StarterKit, Underline, TextAlign, Link) —
 * tout le reste (scripts, gestionnaires d'événements, iframes, styles
 * arbitraires...) est retiré.
 */
export function sanitizeDescriptionHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s", "strike",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "a", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      span: ["style", "class"],
      p: ["style"],
      h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        "color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}
