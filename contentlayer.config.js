import { defineDocumentType, makeSource } from 'contentlayer2/source-files';
// import rehypePrettyCode from 'rehype-pretty-code';

const Docs = defineDocumentType(() => ({
  name: 'Docs',
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
      required: false,
    },
    date: {
      type: 'date',
      description: 'The date of the post',
      required: false,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

// const Component = defineDocumentType(() => ({
//   name: 'Component',
//   filePathPattern: `components/**/*.mdx`,
//   contentType: 'mdx',
//   fields: {
//     title: {
//       type: 'string',
//       description: 'The title of the component',
//       required: true,
//     },
//   },
//   computedFields: {
//     slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
//   },
// }));

export default makeSource({
  contentDirPath: 'content/docs',
  documentTypes: [Docs],
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
