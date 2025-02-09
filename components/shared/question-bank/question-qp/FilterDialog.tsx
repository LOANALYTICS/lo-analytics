"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  generateDistributionReport,
  getFilteredQuestionPapers,
} from "@/services/question-bank/generate-qp.service";
import { getTopics } from "@/services/question-bank/question-bank.service";
import { useEditor } from "@tiptap/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CourseTemplate {
  _id: string;
  course_name: string;
  course_code: string;
}

interface FilterDialogProps {
  courseTemplates: CourseTemplate[];
}

interface TopicQuestion {
  topic: string;
  clos: Record<string, number>;
  total: number;
}

interface QuestionPaper {
  examName: string;
  topicQuestions: TopicQuestion[];
}

export function FilterDialog({ courseTemplates }: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<CourseTemplate | null>(
    null
  );
  const [topics, setTopics] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);

  const handleFilter = async () => {
    if (!selectedYear || !selectedCourse) {
      toast.error("Please select both year and course");
      return;
    }

    try {
      toast.loading("Generating Report...");
      const topicsData = await getTopics(selectedCourse._id);
      const result = await getFilteredQuestionPapers(
        selectedCourse.course_code,
        selectedYear
      );

      const headerHtml = `
        <style>
          * {
            font-size: 12pt !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
          td[rowspan] {
            page-break-inside: avoid;
          }
        </style>
      `;

      const html =
        headerHtml +
        (await generateDistributionReport(
          selectedCourse._id,
          selectedCourse.course_code,
          selectedYear
        ));

      try {
        const html2pdf = (await import("html2pdf.js")).default;
        
        // Create container
        const container = document.createElement("div");
        container.innerHTML = html;
        document.body.appendChild(container);

        // Add logo
        const logo = document.createElement("img");
        logo.src = "/pdf_logo.png";
        logo.style.position = "fixed";
        logo.style.bottom = "20px";
        logo.style.right = "5px";
        logo.style.width = "50px";
        logo.style.height = "50px";
        logo.style.opacity = "0.5";
        logo.style.zIndex = "1000";
        container.appendChild(logo);

        // PDF options
        const opt = {
          margin: 0.5,
          filename: 'distribution_report.pdf',
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: -window.scrollY,
            removeContainer: true,
            allowTaint: true,
            imageTimeout: 0,
          },
          jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "landscape",
            compress: true,
          },
          pagebreak: {
            mode: ["css", "legacy"],
            avoid: ["tr", "td[rowspan]", "thead"],
          },
        };

        // Generate PDF
        await html2pdf()
          .set(opt)
          .from(container)
          .toPdf()
          .get("pdf")
          .then((pdf: any) => {
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
              pdf.setPage(i);
              pdf.saveGraphicsState();
              pdf.setGState(new pdf.GState({ opacity: 0.7 }));
              pdf.addImage(
                "/pdf_logo.png",
                "PNG",
                pdf.internal.pageSize.width - 0.8,
                pdf.internal.pageSize.height - 0.7,
                0.5,
                0.5
              );
              pdf.restoreGraphicsState();
            }
          })
          .save();

        // Cleanup
        document.body.removeChild(container);
        
        setOpen(false);
        setTopics(topicsData);
        setPapers(result.data);
        setShowDistribution(true);
        toast.dismiss();
        toast.success("Report Generated Successfully");
      } catch (error) {
        toast.error("Failed to generate PDF");
        console.error(error);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    }
  };

  useEffect(() => {
    console.log("Component mounted");
    console.log("Topics:", topics);
    console.log("Raw topics object:", JSON.stringify(topics, null, 2));

    // Add this to check if useEffect is running at all
    return () => {
      console.log("Component unmounting");
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Question Papers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2020-2021">2020-2021</SelectItem>
                <SelectItem value="2021-2022">2021-2022</SelectItem>
                <SelectItem value="2022-2023">2022-2023</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedCourse?.course_code}
              onValueChange={(value) =>
                setSelectedCourse(
                  courseTemplates.find((c) => c.course_code === value) || null
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courseTemplates.map((course) => (
                  <SelectItem key={course._id} value={course.course_code}>
                    {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFilter}>Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDistribution} onOpenChange={setShowDistribution}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              Question Distribution for {selectedCourse?.course_name as string}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">S.No</th>
                  <th className="border p-2">Topics</th>
                  <th className="border p-2">Allowed Questions</th>
                  <th className="border p-2">Exams</th>
                  {Array.from(
                    new Set(
                      papers.flatMap((p) =>
                        p.topicQuestions.flatMap((tq: TopicQuestion) =>
                          Object.keys(tq.clos)
                        )
                      )
                    )
                  )
                    .sort()
                    .map((clo) => (
                      <th key={clo} className="border p-2">
                        CLO-{clo}
                      </th>
                    ))}
                  <th className="border p-2">Total Q Per Test</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic, index) => (
                  <tr key={topic.name}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{topic.name}</td>
                    <td className="border p-2">{topic.allowedQuestion}</td>
                    <td className="border p-2">
                      <table className="w-full">
                        <tbody>
                          {papers
                            .filter((paper) =>
                              paper.topicQuestions.some(
                                (tq: TopicQuestion) => tq.topic === topic.name
                              )
                            )
                            .map((paper) => (
                              <tr key={paper.examName}>
                                <td className="border-b p-1">
                                  {paper.examName}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </td>
                    {Array.from(
                      new Set(
                        papers.flatMap((p) =>
                          p.topicQuestions.flatMap((tq: TopicQuestion) =>
                            Object.keys(tq.clos)
                          )
                        )
                      )
                    )
                      .sort()
                      .map((clo) => (
                        <td key={clo} className="border p-2">
                          <table className="w-full">
                            <tbody>
                              {papers
                                .filter((paper) =>
                                  paper.topicQuestions.some(
                                    (tq: TopicQuestion) =>
                                      tq.topic === topic.name
                                  )
                                )
                                .map((paper) => {
                                  const topicQ = paper.topicQuestions.find(
                                    (tq: TopicQuestion) =>
                                      tq.topic === topic.name
                                  );
                                  const cloCount = topicQ?.clos[clo] || 0;
                                  const orderNumbers =
                                    paper.QuestionsOrder.filter(
                                      (q: any) =>
                                        q.questionId.topic === topic.name &&
                                        q.clo.toString() ===
                                          clo.replace("clo", "")
                                    )
                                      .slice(0, cloCount)
                                      .map((q: any) => q.orderNumber)
                                      .join(", ");
                                  return (
                                    <tr key={paper.examName}>
                                      <td className="border-b p-1">
                                        {topicQ?.clos[clo] || "-"}
                                        {topicQ?.clos[clo]
                                          ? ` (${orderNumbers})`
                                          : ""}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </td>
                      ))}
                    <td className="border p-2">
                      <table className="w-full">
                        <tbody>
                          {papers
                            .filter((paper) =>
                              paper.topicQuestions.some(
                                (tq: TopicQuestion) => tq.topic === topic.name
                              )
                            )
                            .map((paper) => {
                              const topicQ = paper.topicQuestions.find(
                                (tq: TopicQuestion) => tq.topic === topic.name
                              );
                              return (
                                <tr key={paper.examName}>
                                  <td className="border-b p-1">
                                    {topicQ?.total || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
