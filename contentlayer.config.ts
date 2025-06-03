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

const Components = defineDocumentType(() => ({
  name: 'Components',
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
    position: {
      type: 'number',
      description: 'Indicates if the post is a component',
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
    position: {
      type: 'number',
      description: 'Indicates if the post is a component',
      required: false,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

const Lib = defineDocumentType(() => ({
  name: 'Lib',
  filePathPattern: 'lib/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      description: 'The title of the library',
      required: true,
    },
    description: {
      type: 'string',
      description: 'The description of the library',
      required: false,
    },
    position: {
      type: 'number',
      description: 'Indicates if the post is a library',
      required: false,
    },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Docs, Components, Blocks, Lib],
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
