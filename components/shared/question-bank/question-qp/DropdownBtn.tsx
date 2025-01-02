'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"

interface DropdownBtnProps {
    questionPaperId: string;
}

export default function DropdownBtn({ questionPaperId }: DropdownBtnProps) {
    const generateQuestionPaper = async (withAnswers: boolean) => {
        try {
            const response = await fetch(`/api/question-paper/${questionPaperId}?withAnswers=${withAnswers}`);
            if (!response.ok) throw new Error('Failed to generate question paper');
            
            const html = await response.text();
            const fileName = withAnswers ? 'answer_key' : 'question_paper';
            
            const html2pdf = (await import('html2pdf.js')).default;
            
            const container = document.createElement('div');
            container.innerHTML = html;
            document.body.appendChild(container);

            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `${fileName}.pdf`,
                image: { 
                    type: 'jpeg', 
                    quality: 0.98
                },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    scrollY: 0,
                    removeContainer: true,
                    allowTaint: true,
                    imageTimeout: 0,
                    logging: true,
                    windowHeight: window.document.documentElement.offsetHeight
                },
                jsPDF: { 
                    unit: 'in',
                    format: 'a4', 
                    orientation: 'portrait',
                    compress: true,
                    hotfixes: ["px_scaling"],
                    putOnlyUsedFonts: true
                },
                pagebreak: { 
                    mode: ['css', 'legacy'],
                    avoid: '.question-container'
                }
            };

            await html2pdf()
                .set(opt)
                .from(container)
                .toPdf()
                .get('pdf')
                .then((pdf: any) => {
                    const totalPages = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(8);
                        pdf.text(
                            `Page ${i} of ${totalPages}`,
                            pdf.internal.pageSize.width - 0.5,
                            pdf.internal.pageSize.height - 0.25,
                            { align: 'right' }
                        );
                    }
                })
                .save();

            document.body.removeChild(container);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => generateQuestionPaper(false)}>
                    Download Question Paper
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateQuestionPaper(true)}>
                    Download with Answers
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
