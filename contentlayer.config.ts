import { defineDocumentType, makeSource } from 'contentlayer2/source-files';
// import rehypePrettyCode from 'rehype-pretty-code';

const Docs = defineDocumentType(() => ({
  name: 'Docs',
  filePathPattern: 'docs/**/*.mdx',
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
    position: {
      type: 'number',
      description: 'Indicates if the post is a component',
      required: true,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

const Component = defineDocumentType(() => ({
  name: 'Component',
  filePathPattern: 'components/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      description: 'The title of the component',
      required: true,
    },
    description: {
      type: 'string',
      description: 'The description of the component',
      required: false,
    },
    group: {
      type: 'string',
      description: 'The group of the component',
      required: false,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

const Blocks = defineDocumentType(() => ({
  name: 'Blocks',
  filePathPattern: 'blocks/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      description: 'The title of the block',
      required: true,
    },
    description: {
      type: 'string',
      description: 'The description of the block',
      required: false,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Docs, Component, Blocks],
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
