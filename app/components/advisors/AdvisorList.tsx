interface Advisor {
    id: number;
    name: string;
    expertise: string;
    description: string;
    experience: string;
  }
  
  const advisors: Advisor[] = [
    {
      id: 1,
      name: "Financial Analyst AI",
      expertise: "Equity Research & Valuation",
      description: "Specialized in financial modeling, DCF analysis, and comparable company analysis.",
      experience: "Trained on 10,000+ equity research reports"
    },
    {
      id: 2,
      name: "M&A Advisor AI",
      expertise: "Mergers & Acquisitions",
      description: "Expert in deal structuring, due diligence, and transaction analysis.",
      experience: "Coverage across major M&A transactions since 2000"
    },
    {
      id: 3,
      name: "Market Strategist AI",
      expertise: "Market Analysis & Strategy",
      description: "Focused on market trends, sector analysis, and investment strategies.",
      experience: "Real-time market data analysis capabilities"
    },
    {
      id: 4,
      name: "IPO Specialist AI",
      expertise: "Capital Markets & IPOs",
      description: "Specialized in IPO preparation, pricing, and execution strategy.",
      experience: "Analysis of global IPO markets"
    }
  ];
  
  export function AdvisorList() {
    return (
      <div className="p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Select Investment Banking Advisor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {advisors.map((advisor) => (
            <div 
              key={advisor.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-r from-gray-50 to-white"
            >
              <div className="flex flex-col h-full">
                <h3 className="font-bold text-xl text-blue-800 mb-2">{advisor.name}</h3>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold w-fit mb-3">
                  {advisor.expertise}
                </div>
                <p className="text-gray-600 mb-4">{advisor.description}</p>
                <div className="mt-auto">
                  <p className="text-sm text-gray-500 italic">
                    {advisor.experience}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }