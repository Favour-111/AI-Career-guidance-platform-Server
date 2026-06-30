const MarketData = require("../models/MarketData");
const ActivityLog = require("../models/ActivityLog");
const {
  fetchLiveMarketSnapshot,
  mergeMarketInsights,
  findCareerMatch,
} = require("../utils/marketInsights");

// @desc    Get all market data / trending careers
// @route   GET /api/market/careers
// @access  Private
const getTrendingCareers = async (req, res, next) => {
  try {
    const { category, demand, search, limit = 20 } = req.query;

    const query = { region: "Nigeria" };
    if (category) query.category = category;
    if (demand) query.demandLevel = demand;
    if (search) query.title = { $regex: search, $options: "i" };

    const careers = await MarketData.find(query)
      .sort({ trending: -1, growthRate: -1 })
      .limit(parseInt(limit));

    await ActivityLog.create({
      user: req.user._id,
      action: "market_data_viewed",
      description: "Viewed market trends",
    }).catch(() => {}); // Fire and forget

    res.json({ careers, total: careers.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get in-demand skills
// @route   GET /api/market/skills
// @access  Private
const getInDemandSkills = async (req, res, next) => {
  try {
    const careers = await MarketData.find({ region: "Nigeria" });

    // Aggregate skills across all careers
    const skillMap = {};
    careers.forEach((career) => {
      career.topSkills.forEach((skill) => {
        if (!skillMap[skill.name]) {
          skillMap[skill.name] = {
            name: skill.name,
            count: 0,
            totalImportance: 0,
          };
        }
        skillMap[skill.name].count += 1;
        skillMap[skill.name].totalImportance += skill.importance;
      });
    });

    const skills = Object.values(skillMap)
      .map((s) => ({
        ...s,
        avgImportance: Math.round((s.totalImportance / s.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    res.json({ skills });
  } catch (error) {
    next(error);
  }
};

// @desc    Get market statistics
// @route   GET /api/market/stats
// @access  Private
const getMarketStats = async (req, res, next) => {
  try {
    const total = await MarketData.countDocuments({ region: "Nigeria" });
    const byDemand = await MarketData.aggregate([
      { $match: { region: "Nigeria" } },
      { $group: { _id: "$demandLevel", count: { $sum: 1 } } },
    ]);
    const byCategory = await MarketData.aggregate([
      { $match: { region: "Nigeria" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgSalary: { $avg: "$averageSalary.mid" },
        },
      },
    ]);
    const topGrowth = await MarketData.find({ region: "Nigeria" })
      .sort({ growthRate: -1 })
      .limit(5)
      .select("title growthRate demandLevel");

    res.json({ total, byDemand, byCategory, topGrowth });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single career market data
// @route   GET /api/market/careers/:careerId
// @access  Private
const getCareerMarketData = async (req, res, next) => {
  try {
    const career = await MarketData.findOne({
      careerId: req.params.careerId,
      region: "Nigeria",
    }).lean();
    if (!career) {
      return res.status(404).json({ message: "Career data not found" });
    }

    const liveSnapshot = await fetchLiveMarketSnapshot({
      query: career.aliases?.[0] || career.title,
      category: career.category,
    });

    res.json({
      career: mergeMarketInsights(career, liveSnapshot),
      liveSnapshot,
    });
  } catch (error) {
    next(error);
  }
};

// Career title → The Muse job category mapping
// The Muse covers ALL fields: healthcare, education, finance, tech, etc.
const CAREER_TO_MUSE_CATEGORY = (q) => {
  const t = q.toLowerCase();
  if (/nurs|doctor|physician|surgeon|healthcare|pharmacist|dentist|radiolog|midwif|paramedic|anaesth|physiother|occupational therap/.test(t))
    return "Healthcare & Medical";
  if (/full.?stack|web dev|frontend|front.end|back.?end|javascript dev|react dev|node dev|vue dev|angular dev/.test(t))
    return "Software Engineering";
  if (/software|mobile dev|ios dev|android dev|app dev|engineer/.test(t))
    return "Software Engineering";
  if (/data scien|machine learn|deep learn|nlp|artificial intel|computer vision|ml engineer/.test(t))
    return "Data & Analytics";
  if (/data analyst|business analyst|bi developer|tableau|power bi/.test(t))
    return "Data & Analytics";
  if (/devops|sre |cloud engineer|infrastructure|kubernetes|docker|sysadmin|network engineer/.test(t))
    return "Software Engineering";
  if (/cybersec|information security|penetration|security engineer/.test(t))
    return "Software Engineering";
  if (/product manager|product owner|product lead/.test(t))
    return "Product";
  if (/ux|ui design|graphic design|visual design|creative direct/.test(t))
    return "Design & UX";
  if (/teacher|tutor|educator|lecturer|professor|instructor|curriculum/.test(t))
    return "Teaching & Education";
  if (/accountant|auditor|finance|financial analyst|investment banker|economist|tax/.test(t))
    return "Finance";
  if (/marketing|seo|content strateg|growth hacker|brand manager|digital market/.test(t))
    return "Marketing & PR";
  if (/sales|account executive|business development|account manager/.test(t))
    return "Sales";
  if (/project manager|program manager|scrum master|agile coach/.test(t))
    return "Project & Program Management";
  if (/hr |human resource|recruiter|talent acquisition|people ops/.test(t))
    return "Human Resources & Recruiting";
  if (/lawyer|attorney|legal counsel|paralegal|compliance/.test(t))
    return "Legal";
  if (/operations|supply chain|logistics|procurement|warehouse/.test(t))
    return "Operations";
  if (/researcher|research scientist|biologist|chemist|lab tech/.test(t))
    return "Research";
  if (/social media|community manager|influencer/.test(t))
    return "Social Media & Community";
  return null;
};

const sanitizeQuery = (value) =>
  String(value || "")
    .replace(/[^a-zA-Z0-9\s\-]/g, "")
    .trim()
    .slice(0, 100);

const buildFallbackLiveJobs = ({ query, career, museCategory }) => {
  const roleTitle = career?.title || query || "Software Engineer";
  const companies = career?.companies?.length
    ? career.companies
    : ["Local employers", "Remote teams", "Growing startups"];
  const tags = [...new Set((career?.topSkills || []).map((skill) => skill.name).filter(Boolean))].slice(0, 3);
  const titlePrefixes = ["Junior", "Mid-level", "Senior", "Lead", "Remote", "Contract"];
  const locations = ["Lagos, Nigeria", "Abuja, Nigeria", "Remote / Nigeria", "Hybrid / Nigeria"];
  const now = new Date().toISOString();

  const jobs = companies.slice(0, 6).map((company, index) => ({
    id: `${career?.careerId || "fallback"}-${index}`,
    title: `${titlePrefixes[index % titlePrefixes.length]} ${roleTitle}`,
    company,
    location: locations[index % locations.length],
    salary: null,
    type: career?.remote ? "Remote" : "Full-time",
    tags,
    url: `https://www.google.com/search?q=${encodeURIComponent(`${company} ${roleTitle} jobs`)}`,
    description: `Cached market suggestion for ${roleTitle} at ${company}. ${
      career?.description || `Explore openings related to ${query}.`
    }`,
    published: now,
  }));

  return {
    jobs,
    total: career?.jobOpenings || jobs.length,
    query,
    category: museCategory || career?.category || "All Fields",
    source: "Cached market data",
    sourceUrl: null,
    fallback: true,
  };
};

// @desc    Fetch live job listings from The Muse (free, no API key, all career fields)
// @route   GET /api/market/live-jobs?query=Nurse
// @access  Private
const getLiveJobs = async (req, res, next) => {
  try {
    const { query = "software engineer" } = req.query;
    const axios = require("axios");

    const safeQuery = sanitizeQuery(query) || "software engineer";
    const museCategory = CAREER_TO_MUSE_CATEGORY(safeQuery);

    // Build base params — category narrows to the right field
    const baseParams = { descending: true };
    if (museCategory) baseParams.category = museCategory;

    // Fetch 2 pages in parallel (~40 jobs) so we have enough to filter from.
    // Use settled promises so one upstream failure does not take the whole endpoint down.
    const responses = await Promise.allSettled([
      axios.get("https://www.themuse.com/api/public/jobs", {
        params: { ...baseParams, page: 0 },
        timeout: 10000,
      }),
      axios.get("https://www.themuse.com/api/public/jobs", {
        params: { ...baseParams, page: 1 },
        timeout: 10000,
      }),
    ]);

    const fulfilledResponses = responses
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const allResults = fulfilledResponses.flatMap((response) => response.data?.results || []);

    if (!allResults.length) {
      const careers = await MarketData.find({ region: "Nigeria" }).lean();
      const matchedCareer = findCareerMatch(safeQuery, careers);
      return res.json(buildFallbackLiveJobs({
        query: safeQuery,
        career: matchedCareer,
        museCategory,
      }));
    }

    // Score each job: count how many query-title words appear in the job title
    // "Full Stack Web Developer" → ["full","stack","web","developer"]
    const queryWords = safeQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const scored = allResults.map((job) => {
      const titleLower = (job.name || "").toLowerCase();
      const score = queryWords.filter((w) => titleLower.includes(w)).length;
      return { ...job, _score: score };
    });

    // STRICT filter — only keep jobs where at least 1 title word matches the query
    // (prevents "iOS Developer" showing up under "Full Stack Web Developer")
    let filtered = scored.filter((j) => j._score > 0);

    // Graceful fallback: if strict filter gives <5 results, use all results sorted
    if (filtered.length < 5) {
      filtered = [...scored];
    }

    // Sort by match score (best first) then take top 15
    filtered.sort((a, b) => b._score - a._score);

    const jobs = filtered.slice(0, 15).map((job) => ({
      id:          job.id,
      title:       job.name,
      company:     job.company?.name || "Unknown",
      location:    job.locations?.[0]?.name || "Flexible / Remote",
      salary:      null,
      type:        job.levels?.[0]?.name || null,
      tags:        (job.categories || []).map((c) => c.name).filter((n) => n !== museCategory).slice(0, 3),
      url:         job.refs?.landing_page || "#",
      description: job.contents
        ? job.contents.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").slice(0, 200)
        : "",
      published:   job.publication_date,
    }));

    res.json({
      jobs,
      total:     fulfilledResponses[0]?.data?.total || jobs.length,
      query:     safeQuery,
      category:  museCategory || "All Fields",
      source:    "The Muse",
      sourceUrl: "https://www.themuse.com",
    });
  } catch (error) {
    const careers = await MarketData.find({ region: "Nigeria" }).lean().catch(() => []);
    const matchedCareer = findCareerMatch(sanitizeQuery(req.query?.query), careers);

    console.warn(
      "[market/live-jobs] Falling back to cached market data:",
      error.message,
    );

    return res.json(
      buildFallbackLiveJobs({
        query: sanitizeQuery(req.query?.query) || "software engineer",
        career: matchedCareer,
        museCategory: CAREER_TO_MUSE_CATEGORY(
          sanitizeQuery(req.query?.query) || "software engineer",
        ),
      }),
    );
  }
};

module.exports = {
  getTrendingCareers,
  getInDemandSkills,
  getMarketStats,
  getCareerMarketData,
  getLiveJobs,
};
