interface AdvisorProps {
    name: string;
    role: string;
    expertise: string;
    avatar: string;
    onSelect: () => void;
  }
  
  export function AdvisorCard({ name, role, expertise, avatar, onSelect }: AdvisorProps) {
    return (
      <div 
        onClick={onSelect}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <img 
            src={avatar} 
            alt={name} 
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h3 className="text-xl font-semibold">{name}</h3>
            <p className="text-gray-600 dark:text-gray-300">{role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Expertise: {expertise}
            </p>
          </div>
        </div>
      </div>
    );
  }