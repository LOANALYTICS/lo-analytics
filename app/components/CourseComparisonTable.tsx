interface ComparisonData {
  yearA: string;
  yearB: string;
  courses: {
    courseCode: string;
    courseTitle: string;
    yearA: {
      accepted: number;
      rejected: number;
      kr20: number;
    };
    yearB: {
      accepted: number;
      rejected: number;
      kr20: number;
    };
  }[];
}

const CourseComparisonTable = ({ data }: { data: ComparisonData }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th colSpan={2} className="border border-gray-300 bg-yellow-200 p-2">LEVEL 3</th>
            <th colSpan={3} className="border border-gray-300 p-2">1st Semester, {data.yearA}</th>
            <th colSpan={3} className="border border-gray-300 p-2">1st Semester, {data.yearB}</th>
          </tr>
          <tr>
            <th className="border border-gray-300 p-2">N</th>
            <th className="border border-gray-300 p-2">Course Title & Course code</th>
            <th className="border border-gray-300 p-2">Total Accepted Questions</th>
            <th className="border border-gray-300 p-2">Total Rejected Questions</th>
            <th className="border border-gray-300 p-2">KR20</th>
            <th className="border border-gray-300 p-2">Total Accepted Questions</th>
            <th className="border border-gray-300 p-2">Total Rejected Questions</th>
            <th className="border border-gray-300 p-2">KR20</th>
          </tr>
        </thead>
        <tbody>
          {data.courses.map((course, index) => (
            <>
              <tr key={`${course.courseCode}-n`}>
                <td rowSpan={2} className="border border-gray-300 p-2">{index + 1}</td>
                <td className="border border-gray-300 p-2">
                  {course.courseTitle} ({course.courseCode})
                </td>
                <td className="border border-gray-300 p-2">{course.yearA.accepted}</td>
                <td className="border border-gray-300 p-2">{course.yearA.rejected}</td>
                <td className="border border-gray-300 p-2">{course.yearA.kr20}</td>
                <td className="border border-gray-300 p-2">{course.yearB.accepted}</td>
                <td className="border border-gray-300 p-2">{course.yearB.rejected}</td>
                <td className="border border-gray-300 p-2">{course.yearB.kr20}</td>
              </tr>
              <tr key={`${course.courseCode}-p`}>
                <td className="border border-gray-300 p-2">%</td>
                <td className="border border-gray-300 p-2">
                  {((course.yearA.accepted / (course.yearA.accepted + course.yearA.rejected)) * 100).toFixed(2)}%
                </td>
                <td className="border border-gray-300 p-2">
                  {((course.yearA.rejected / (course.yearA.accepted + course.yearA.rejected)) * 100).toFixed(2)}%
                </td>
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2">
                  {((course.yearB.accepted / (course.yearB.accepted + course.yearB.rejected)) * 100).toFixed(2)}%
                </td>
                <td className="border border-gray-300 p-2">
                  {((course.yearB.rejected / (course.yearB.accepted + course.yearB.rejected)) * 100).toFixed(2)}%
                </td>
                <td className="border border-gray-300 p-2">-</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseComparisonTable; 