import { Component, ReactNode } from "react";
import { Wrench } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto">
              <Wrench className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
            <p className="text-muted-foreground text-sm">يرجى إعادة تحميل الصفحة</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
