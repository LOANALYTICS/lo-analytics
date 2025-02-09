"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface DropdownBtnProps {
  questionPaperId: string;
  courseId: string;
}

export default function DropdownBtn({ questionPaperId, courseId }: DropdownBtnProps) {
  const generateQuestionPaper = async (withAnswers: boolean) => {
    try {
      const response = await fetch(
        `/api/question-paper/${questionPaperId}?withAnswers=${withAnswers}&courseId=${courseId}`
      );
      if (!response.ok) throw new Error("Failed to generate question paper");

      const html = await response.text();
      const fileName = withAnswers ? "answer_key" : "question_paper";

      const html2pdf = (await import("html2pdf.js")).default;

      const styledHtml = `
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 1cm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.4;
                        font-size: 16px;
                        margin: 0;
                        padding: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        table-layout: fixed;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px 4px;
                        text-align: center;
                        vertical-align: middle;
                        word-wrap: break-word;
                        height: 30px;
                        line-height: 1.2;
                    }
                    td div {
                        margin: 4px 0;
                        padding: 4px 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 24px;
                    }
                </style>
                ${html}
            `;

      const container = document.createElement("div");
      container.innerHTML = styledHtml;
      document.body.appendChild(container);

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${fileName}.pdf`,
        image: {
          type: "jpeg",
          quality: 1.0,
        },
        html2canvas: {
          scale: 4,
          useCORS: true,
          scrollY: 0,
          removeContainer: true,
          allowTaint: true,
          imageTimeout: 0,
          logging: false,
          windowHeight: window.document.documentElement.offsetHeight,
          letterRendering: true,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
          compress: true,
          hotfixes: ["px_scaling"],
          putOnlyUsedFonts: true,
        },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ".question, .answer, .no-break-class,.question-container, .option,.options",
        },
      };

      await html2pdf()
        .set(opt)
        .from(container)
        .toPdf()
        .get("pdf")
        .then((pdf: any) => {
          const totalPages = pdf.internal.getNumberOfPages();

          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Save graphics state for logo
            pdf.saveGraphicsState();
            pdf.setGState(new pdf.GState({ opacity: 0.5 }));

            // Add logo to bottom right corner
            const logoImg = new Image();
            logoImg.src = "/pdf_logo.png";

            pdf.addImage(
              logoImg,
              "PNG",
              pdf.internal.pageSize.width - 1, // 1 inch from right
              pdf.internal.pageSize.height - 1, // 1 inch from bottom
              0.6, // width in inches
              0.6 // height in inches
            );

            pdf.restoreGraphicsState();
          }
        })
        .save();

      document.body.removeChild(container);
    } catch (error) {
      console.error("Error generating PDF:", error);
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
  );
}
