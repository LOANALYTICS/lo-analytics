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

      // Add header with larger text
      const headerHtml = `
        <style>
          * {
            font-size: 16pt !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid black;
            padding: 12px;
            text-align: left;
          }
          th {
            font-weight: bold;
            background-color: #f5f5f5;
          }
          h1 {
            font-size: 24pt !important;
            text-align: center;
            margin-bottom: 30px;
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

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      // Create PDF instance with larger dimensions
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [297, 210], // A4 landscape dimensions
      }) as jsPDF & {
        GState: new (options: { opacity: number }) => any;
      };

      // Convert HTML to canvas with increased scale
      const canvas = await html2canvas(container, {
        scale: 4, // Increased from 3 to 4 for even better quality
        useCORS: true,
        logging: false,
      });

      // Calculate dimensions with adjusted scaling
      const imgWidth = 287; // Increased from 277 to use more page width
      const pageHeight = 200; // Increased from 190 to use more page height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 5;
      let page = 1;

      // Add content to PDF with adjusted positioning
      while (heightLeft >= 0) {
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1.0), // Increased quality from 0.98 to 1.0
          "JPEG",
          5, // Reduced margin from 10 to 5
          position,
          imgWidth,
          imgHeight
        );

        // Add logo to bottom right of each page
        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity: 0.5 }));

        // Add logo to bottom right corner
        pdf.addImage(
          "/pdf_logo.png",
          "PNG",
          pdf.internal.pageSize.width - 25, // 25mm from right
          pdf.internal.pageSize.height - 25, // 25mm from bottom
          15, // width in mm
          15 // height in mm
        );

        pdf.restoreGraphicsState();

        heightLeft -= pageHeight;

        if (heightLeft > 0) {
          pdf.addPage();
          position = 10 - (imgHeight - pageHeight * page);
          page++;
        }
      }

      // Save PDF
      pdf.save("distribution_report.pdf");
      document.body.removeChild(container);

      setOpen(false);

      console.log(result.data);
      setTopics(topicsData);
      setPapers(result.data);
      setOpen(false);
      setShowDistribution(true);
      toast.dismiss();
      toast.success("Report Generated Successfully");
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
