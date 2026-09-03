import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = Omit<ComponentProps<'input'>, 'type'> & {
    ref?: Ref<HTMLInputElement>;
    /**
     * Keep browser password managers away from this field. Needed for values
     * like API keys that must never be replaced by a saved login password.
     */
    noAutofill?: boolean;
};

export default function PasswordInput({
    className,
    ref,
    noAutofill,
    ...props
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    // Password managers skip readonly fields; drop it on first focus so the
    // user can still type.
    const [readOnly, setReadOnly] = useState(noAutofill ?? false);

    const guard = noAutofill
        ? {
              autoComplete: 'new-password' as const,
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: false,
              'data-1p-ignore': '',
              'data-lpignore': 'true',
              'data-bwignore': '',
              'data-form-type': 'other',
              readOnly,
              onFocus: () => setReadOnly(false),
          }
        : {};

    return (
        <div className="relative">
            <Input
                type={showPassword ? 'text' : 'password'}
                className={cn('pr-10', className)}
                ref={ref}
                {...guard}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 focus-visible:ring-[3px] focus-visible:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="size-4" />
                ) : (
                    <Eye className="size-4" />
                )}
            </button>
        </div>
    );
}
