import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FieldValues,
  type Resolver,
  useForm,
  type DefaultValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { ZodTypeAny } from "zod";

type ZodResolverSchema = Parameters<typeof zodResolver>[0];

export const useZodForm = <TFormValues extends FieldValues>(
  schema: ZodTypeAny,
  options?: Omit<UseFormProps<TFormValues>, "resolver"> & {
    defaultValues?: DefaultValues<TFormValues>;
  },
): UseFormReturn<TFormValues> =>
  useForm<TFormValues>({
    ...options,
    resolver: zodResolver(
      schema as unknown as ZodResolverSchema,
    ) as unknown as Resolver<TFormValues>,
  });
