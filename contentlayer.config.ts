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
    GettingStartedPosition: {
      type: 'number',
      description: 'Indicates if the post is a component',
      required: false,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

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
