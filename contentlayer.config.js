import { defineDocumentType, makeSource } from 'contentlayer2/source-files';
import rehypePrettyCode from 'rehype-pretty-code'; // Ajoutez cette importation

// /** @type {import('contentlayer/source-files').ComputedFields} */
// const computedFields = {
//   slug: {
//     type: "string",
//     resolve: (doc) => `/${doc._raw.flattenedPath}`,
//   },
//   slugAsParams: {
//     type: "string",
//     resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
//   },
// }

const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      description: 'The title of the post',
      required: true,
    },
    description: {
      type: 'string',
      description: 'The description of the post',
      required: true,
    },
    date: {
      type: 'date',
      description: 'The date of the post',
      required: true,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
  // computedFields: {
  //   // url: {
  //   //   type: 'string',
  //   //   resolve: (doc) => `/posts/${doc._raw.flattenedPath}`,
  //   // },
  // },
}));

export default makeSource({
  contentDirPath: 'content/docs',
  documentTypes: [Doc],
  // mdx: {
  //   rehypePlugins: [
  //     [
  //       rehypePrettyCode,
  //       {
  //         theme: 'github-dark',
  //         onVisitLine(node) {
  //           if (node.children.length === 0) {
  //             node.children = [{ type: 'text', value: ' ' }];
  //           }
  //         },
  //       },
  //     ],
  //   ],
  // },
});
