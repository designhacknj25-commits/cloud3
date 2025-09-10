"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getFaqs, saveFaqs, getUsers, type FAQ } from "@/lib/data";
import { generateFaqs } from "@/ai/flows/faq-flow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Sparkles, Trash2, Pencil } from "lucide-react";
import { FaqItem } from "@/components/faq-item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, "Question must be at least 5 characters."),
  answer: z.string().min(10, "Answer must be at least 10 characters."),
});

export default function ManageFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isAiPending, startAiTransition] = useTransition();
  const [isFormPending, startFormTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof faqSchema>>({
    resolver: zodResolver(faqSchema),
    defaultValues: { id: "", question: "", answer: "" },
  });

  useEffect(() => {
    setFaqs(getFaqs());
  }, []);

  const handleGenerateFaqs = () => {
    startAiTransition(async () => {
      try {
        const teacherEmail = localStorage.getItem("userEmail");
        if (!teacherEmail) throw new Error("Teacher not logged in.");

        const users = getUsers();
        const teacher = users.find(u => u.email === teacherEmail);
        const questions = teacher?.notifications.map(n => n.message) || [];

        if (questions.length < 3) {
          toast({
            variant: "destructive",
            title: "Not Enough Data",
            description: "Need at least 3 student questions in your inbox to generate FAQs.",
          });
          return;
        }

        const generated = await generateFaqs({ questions });
        
        // Add new, non-duplicate FAQs to the existing list
        const newFaqs = generated.faqs.filter(
          (genFaq: any) => !faqs.some(exFaq => exFaq.question.toLowerCase() === genFaq.question.toLowerCase())
        ).map((faq: any) => ({ ...faq, id: `faq${Date.now()}${Math.random()}` }));

        if (newFaqs.length === 0) {
            toast({ title: "No New FAQs", description: "The AI did not find any new common questions to add." });
            return;
        }

        const updatedFaqs = [...faqs, ...newFaqs];
        setFaqs(updatedFaqs);
        saveFaqs(updatedFaqs);

        toast({
          title: "AI Analysis Complete",
          description: `${newFaqs.length} new FAQs have been generated and added to your list.`,
        });

      } catch (error) {
        console.error("Error generating FAQs:", error);
        toast({
          variant: "destructive",
          title: "AI Generation Failed",
          description: "Could not generate FAQs at this time. Please try again later.",
        });
      }
    });
  };

  const handleOpenDialog = (faq: FAQ | null = null) => {
    setEditingFaq(faq);
    form.reset(faq || { id: "", question: "", answer: "" });
    setIsDialogOpen(true);
  };

  const handleDelete = (faqId: string) => {
    const updatedFaqs = faqs.filter(f => f.id !== faqId);
    setFaqs(updatedFaqs);
    saveFaqs(updatedFaqs);
    toast({ title: "FAQ Deleted" });
  };

  const onSubmit = (values: z.infer<typeof faqSchema>) => {
    startFormTransition(() => {
        let updatedFaqs;
        if (editingFaq) {
            // Editing existing FAQ
            updatedFaqs = faqs.map(f => f.id === editingFaq.id ? { ...f, ...values } : f);
             toast({ title: "FAQ Updated" });
        } else {
            // Adding new FAQ
            const newFaq = { ...values, id: `faq${Date.now()}` };
            updatedFaqs = [...faqs, newFaq];
            toast({ title: "FAQ Added" });
        }
        setFaqs(updatedFaqs);
        saveFaqs(updatedFaqs);
        setIsDialogOpen(false);
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage FAQs</h1>
          <p className="text-muted-foreground">Create, edit, and use AI to generate FAQs for your students.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
            </Button>
            <Button onClick={handleGenerateFaqs} disabled={isAiPending}>
                {isAiPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate with AI
            </Button>
        </div>
      </div>

      <div className="space-y-4">
        {faqs.length > 0 ? (
          faqs.map(faq => (
            <FaqItem
              key={faq.id}
              faq={faq}
              onEdit={() => handleOpenDialog(faq)}
              onDelete={() => handleDelete(faq.id)}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-card/30 rounded-lg">
            <p className="text-muted-foreground">You haven't added any FAQs yet.</p>
            <Button onClick={handleGenerateFaqs} disabled={isAiPending} className="mt-4">
              Click here to generate some with AI
            </Button>
          </div>
        )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add a New FAQ'}</DialogTitle>
                    <DialogDescription>
                        Fill in the question and answer below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="question"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., When is the project due?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="answer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Answer</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Provide a clear and concise answer..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isFormPending}>
                               {isFormPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save FAQ
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
