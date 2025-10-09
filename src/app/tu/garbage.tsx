//@ts-nocheck
/** biome-ignore-all lint/correctness/noChildrenProp: skipping */

<form.Field
  name='name'
  children={(field) => {
    return (
      <input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        type='text'
      />
    );
  }}
/>;

// const [state, action] = useActionState(mutaction, initialFormState);

// const form = useForm({
//   ...opts,
//   transform: useTransform((baseForm) => mergeForm(baseForm, state!), [state]),
//   validators: {
//     onSubmit: schema,
//   },
// });

//   const mutation = useMutation({
//     mutationFn: action,
//   });

//   const form = useForm({
//     ...opts,
//     onSubmit: async ({ value, formApi }) => {
//       await mutation.mutateAsync(value);

//       await nameResult.refetch();

//       formApi.reset(value);
//     },

//     validators: {
//       onSubmit: schema,
//     },
//   });
//   const ddform = useFormRhf({});
<form.Subscribe selector={(formState) => [formState.canSubmit, formState.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <button type='submit' disabled={!canSubmit}>
      {isSubmitting ? '...' : 'Submit'}
    </button>
  )}
</form.Subscribe>;
