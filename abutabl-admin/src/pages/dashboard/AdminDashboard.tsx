import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getRequest } from "@/utils/fetchMethods";
import PercentInfoCard from "../../components/dashboard/PercentInfoCard";
import IconInfoCard from "../../components/dashboard/IconInfoCard";
import DataSection from "../../components/dashboard/DataSection";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  {
    name: "Jan",
    uv: 1800,
  },
  {
    name: "Feb",
    uv: 3000,
  },
  {
    name: "Mar",
    uv: 2000,
  },
  {
    name: "Apr",
    uv: 2780,
  },
  {
    name: "May",
    uv: 1890,
  },
  {
    name: "Jun",
    uv: 2390,
  },
  {
    name: "Jul",
    uv: 3490,
  },
];

const data01 = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
  },
];

const data02 = [
  {
    name: "Group A",
    value: 2400,
  },
  {
    name: "Group B",
    value: 4567,
  },
  {
    name: "Group C",
    value: 1398,
  },
  {
    name: "Group D",
    value: 9800,
  },
  {
    name: "Group E",
    value: 3908,
  },
  {
    name: "Group F",
    value: 4800,
  },
];

const data03 = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

const InnerChartsPie = ({ data }: { data: typeof data02 }) => {
  return (
    <PieChart width={320} height={250}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#82ca9d"
        label
      />
    </PieChart>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginUser = useSelector((state: RootState) => state.login.user);
  const [stats, setStats] = useState<any>(null);
  const [assignRows, setAssignRows] = useState<any[]>([]);
  const [subjectPie, setSubjectPie] = useState(data02);

  useEffect(() => {
    let cancelled = false;
    getRequest({}, "/api/dashboard/stats")
      .then((res: any) => {
        if (cancelled || !res?.stats) return;
        setStats(res.stats);
        const rows = res?.charts?.subjects_by_school;
        if (Array.isArray(rows) && rows.length) {
          setSubjectPie(
            rows.map((r: any) => ({
              name: String(r.school ?? "School"),
              value: Number(r.count) || 0,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isTeacher = Boolean(loginUser?.type && loginUser?.type !== "admin");

  useEffect(() => {
    if (!isTeacher) return;
    let cancelled = false;
    getRequest({}, "/api/dashboard/teacher-assignments")
      .then((res: any) => {
        if (!cancelled && res?.assignments) setAssignRows(res.assignments);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  const pctActive =
    stats?.students_total > 0
      ? Math.round(
          (stats.students_active / Math.max(1, stats.students_total)) * 100
        )
      : 0;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",

          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">{t("DASHBOARD")}</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            sx={{ color: "#004D34", borderColor: "#004D34", "&:hover": { borderColor: "#004D34", bgcolor: "#004D340A" } }}
            onClick={() => navigate("/user/employee")}
          >
            Users
          </Button>
          <Button
            variant="outlined"
            sx={{ color: "#004D34", borderColor: "#004D34", "&:hover": { borderColor: "#004D34", bgcolor: "#004D340A" } }}
            onClick={() => navigate("/user/student")}
          >
            Students
          </Button>
        </Box>
      </Box>

      <Grid container gap={1} sx={{ py: 2 }}>
        <PercentInfoCard title="Active students" value={`${pctActive}%`} />
        <PercentInfoCard
          title="Student count (active / total)"
          value={`${stats?.students_active ?? 0} / ${
            stats?.students_total ?? 0
          }`}
          color={"#FFAD0D"}
        />
        <IconInfoCard
          title="Subjects (in scope)"
          value={String(stats?.subjects_total ?? 0)}
          color={"#F64C4C"}
          icon={require("../../assets/pie.png")}
        />
        <IconInfoCard
          title="Open assignments"
          value={String(stats?.assignments_open ?? 0)}
          icon={require("../../assets/chart.png")}
        />
      </Grid>

      {isTeacher && (
        <Grid container sx={{ mb: 2, px: 2 }}>
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                bgcolor: "#fff",
                border: "1px solid #091E4224",
                borderRadius: 1,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Your assignments
              </Typography>
              <Button
                variant="contained"
                sx={{ mb: 2, bgcolor: "#004d34" }}
                onClick={() => navigate("/user/student")}
              >
                Assign to students
              </Button>
              {assignRows.length === 0 ? (
                <Typography color="text.secondary">
                  No assignments created yet.
                </Typography>
              ) : (
                assignRows.slice(0, 10).map((a: any) => (
                  <Typography key={a.id} variant="body2" sx={{ py: 0.5 }}>
                    {(a.assigned_name as string) ?? a.type} · reached{" "}
                    {a.students_count ?? 0} students
                    {a.due_date ? ` · due ${a.due_date}` : ""}
                  </Typography>
                ))
              )}
            </Box>
          </Grid>
        </Grid>
      )}

      <Grid container gap={2}>
        <Grid item xs={12} md={8}>
          <DataSection chart={Charts} />
        </Grid>
        <Grid item xs={12} md={3.5}>
          <DataSection chart={() => <InnerChartsPie data={subjectPie} />} />
        </Grid>
        <Grid item xs={12} md={8}>
          <DataSection chart={ComparisonCharts} />
        </Grid>
        <Grid item xs={12} md={3.5}>
          <DataSection chart={OutterCharts} />
        </Grid>
        <Grid item xs={12} md={8}>
          <DataSection chart={LinerCharts} />
        </Grid>
        <Grid item xs={12} md={3.5}>
          <DataSection chart={MiniLinerCharts} />
        </Grid>
      </Grid>
    </>
  );
};

export default AdminDashboard;

const Charts = () => {
  return (
    <BarChart width={730} height={250} data={data} barSize={20}>
      <CartesianGrid strokeDasharray="1" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="uv" fill="#82ca9d" />
    </BarChart>
  );
};

const ComparisonCharts = () => {
  return (
    <BarChart width={730} height={250} data={data01}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="pv" fill="#8884d8" />
      <Bar dataKey="uv" fill="#82ca9d" />
    </BarChart>
  );
};

const OutterCharts = () => {
  return (
    <PieChart width={320} height={250}>
      <Pie
        data={data02}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        fill="#82ca9d"
        label
      />
    </PieChart>
  );
};

const LinerCharts = () => {
  return (
    <AreaChart
      width={730}
      height={250}
      data={data03}
      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip />
      <Area
        type="monotone"
        dataKey="uv"
        stroke="#8884d8"
        fillOpacity={1}
        fill="url(#colorUv)"
      />
    </AreaChart>
  );
};

const MiniLinerCharts = () => {
  return (
    <AreaChart
      width={300}
      height={250}
      data={data03}
      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip />
      <Area
        type="monotone"
        dataKey="uv"
        stroke="#8884d8"
        fillOpacity={1}
        fill="url(#colorUv)"
      />
    </AreaChart>
  );
};
