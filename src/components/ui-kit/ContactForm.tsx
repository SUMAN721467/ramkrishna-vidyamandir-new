import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "./ActionButton";

interface FormState {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const emptyForm: FormState = { name: "", phone: "", email: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) nextErrors.name = "Please enter your full name.";
    if (!/^[0-9+\s-]{10,15}$/.test(form.phone.trim()))
      nextErrors.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      nextErrors.email = "Please enter a valid email address.";
    if (form.message.trim().length < 10)
      nextErrors.message = "Please write at least a short message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    toast.success("Thank you! Your message has been noted.", {
      description: "Our office will get back to you within two working days.",
    });
    setForm(emptyForm);
  };

  const fieldClass =
    "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={fieldClass}
            placeholder="Your name"
          />
          {errors.name ? (
            <p id="contact-name-error" className="mt-1.5 text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-foreground">
            Phone number
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            className={fieldClass}
            placeholder="+91 00000 00000"
          />
          {errors.phone ? (
            <p id="contact-phone-error" className="mt-1.5 text-xs text-destructive">
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={fieldClass}
          placeholder="you@example.com"
        />
        {errors.email ? (
          <p id="contact-email-error" className="mt-1.5 text-xs text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`${fieldClass} resize-y`}
          placeholder="How can we help you?"
        />
        {errors.message ? (
          <p id="contact-message-error" className="mt-1.5 text-xs text-destructive">
            {errors.message}
          </p>
        ) : null}
      </div>

      <ActionButton type="submit" size="lg" className="w-full sm:w-auto">
        <Send aria-hidden="true" className="size-4" />
        Send message
      </ActionButton>
      <p className="text-xs text-muted-foreground">
        This form is for enquiry purposes only and is not connected to any external service.
      </p>
    </form>
  );
}
