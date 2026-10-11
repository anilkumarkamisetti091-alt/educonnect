/**
 * SkillBridge - Chart Visualizer Engine
 * High-performance Chart.js integration with canvas fallback for radar, comparison bars, and gauges.
 */

const ChartManager = {
  instances: {},

  destroyChart(canvasId) {
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
      delete this.instances[canvasId];
    }
  },

  /**
   * Render Student Skill Radar: Student Proficiency vs Industry Benchmark
   */
  renderStudentRadar(canvasId, gapAnalysis) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this.destroyChart(canvasId);

    if (typeof Chart === 'undefined') {
      this.renderFallbackRadar(canvas, gapAnalysis);
      return;
    }

    const labels = gapAnalysis.gapDetails.map(g => g.skillName);
    const studentScores = gapAnalysis.gapDetails.map(g => g.studentScore);
    const benchmarkScores = gapAnalysis.gapDetails.map(g => g.benchmarkScore);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#e2e8f0' : '#475569';

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${gapAnalysis.student.name} (Current)`,
            data: studentScores,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            borderColor: '#6366f1',
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6366f1',
            borderWidth: 2.5,
            pointRadius: 4
          },
          {
            label: `Industry Benchmark (${gapAnalysis.track.title})`,
            data: benchmarkScores,
            fill: true,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#f59e0b',
            borderWidth: 2,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const index = context.dataIndex;
                const item = gapAnalysis.gapDetails[index];
                if (context.datasetIndex === 0) {
                  return `Target: ${item.benchmarkScore} | Gap: ${item.deficit > 0 ? '-' + item.deficit : 'Mastered (+' + Math.abs(item.deficit) + ')'}`;
                }
                return null;
              }
            }
          }
        },
        scales: {
          r: {
            angleLines: { color: gridColor },
            grid: { color: gridColor },
            pointLabels: {
              color: textColor,
              font: { family: "'Inter', sans-serif", size: 11, weight: 500 }
            },
            ticks: {
              backdropColor: 'transparent',
              color: textColor,
              stepSize: 20,
              min: 0,
              max: 100
            }
          }
        }
      }
    });
  },

  /**
   * Cohort Comparison Bar: Class Average vs Industry Benchmark
   */
  renderCohortComparison(canvasId, cohortAnalytics) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this.destroyChart(canvasId);

    if (typeof Chart === 'undefined') return;

    const labels = cohortAnalytics.rankedCohortGaps.map(g => g.skill.name);
    const avgScores = cohortAnalytics.rankedCohortGaps.map(g => g.avgScore);
    const benchmarkScores = cohortAnalytics.rankedCohortGaps.map(g => g.benchmark);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Class Average',
            data: avgScores,
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Industry Target',
            data: benchmarkScores,
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: "'Inter', sans-serif", size: 12, weight: 600 }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 11 },
              maxRotation: 30,
              minRotation: 30
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, stepSize: 20 },
            min: 0,
            max: 100
          }
        }
      }
    });
  },

  /**
   * Semi-Doughnut Career Readiness Gauge for Parent & Student view
   */
  renderReadinessGauge(canvasId, readinessScore) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this.destroyChart(canvasId);

    if (typeof Chart === 'undefined') return;

    let scoreColor = '#10b981'; // Green for high
    if (readinessScore < 60) scoreColor = '#ef4444'; // Red
    else if (readinessScore < 75) scoreColor = '#f59e0b'; // Amber

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const emptyColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [readinessScore, 100 - readinessScore],
            backgroundColor: [scoreColor, emptyColor],
            borderWidth: 0,
            circumference: 180,
            rotation: 270
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  },

  /**
   * Canvas Fallback if CDN is unreachable
   */
  renderFallbackRadar(canvas, gapAnalysis) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('Skill Radar Visualization', width / 2, 40);

    // Draw simple bars for each skill
    const items = gapAnalysis.gapDetails;
    const startY = 70;
    const barHeight = 18;
    const gap = 12;

    items.forEach((item, i) => {
      const y = startY + i * (barHeight + gap);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(item.skillName, 20, y + 14);

      // Student bar
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(220, y, item.studentScore * 2, barHeight);

      // Target marker
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(220 + item.benchmarkScore * 2, y - 2, 3, barHeight + 4);
    });
  }
};
