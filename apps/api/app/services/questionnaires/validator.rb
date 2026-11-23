# typed: true

# 問診の答えを確かめる。DB も時計も読まない
module Questionnaires
  module Validator
    extend T::Sig

    MAX_TEXT = 1000

    # 1問の答え。文章と選択なら文字、複数選択なら文字の並び、答えていなければ nil
    Answer = T.type_alias { T.nilable(T.any(String, T::Array[String])) }

    # questions は QuestionnaireQuestion の並び。answers は { 質問の id（文字）=> 値 }。
    # 値は、文章と選択なら文字、複数選択なら文字の並び。
    # 悪い所を、質問ごとに、まとめて返す（UserError の並び。field は "answers.<質問の id>"）
    sig { params(questions: T::Array[QuestionnaireQuestion], answers: T::Hash[String, Answer], submit: T::Boolean).returns(T::Array[UserError]) }
    def self.errors(questions, answers, submit:)
      questions.filter_map do |question|
        message = message_for(question, answers[question.id.to_s], submit: submit)
        UserError.new(code: "INVALID_INPUT", message: "#{question.label}: #{message}", field: "answers.#{question.id}") if message
      end
    end

    sig { params(question: QuestionnaireQuestion, value: Answer, submit: T::Boolean).returns(T.nilable(String)) }
    def self.message_for(question, value, submit:)
      if blank?(value)
        # 途中まで保存するときは、空でもよい。提出するときだけ、必須を確かめる
        return submit && question.required ? "答えを入れてください" : nil
      end

      case question.kind
      when "text"
        return "文字で入れてください" unless value.is_a?(String)

        "#{MAX_TEXT}文字までで入れてください" if value.length > MAX_TEXT
      when "single"
        "選択肢から選んでください" unless value.is_a?(String) && question.options.include?(value)
      when "multiple"
        "選択肢から選んでください" unless value.is_a?(Array) && value.uniq.size == value.size && (value - question.options).empty?
      end
    end

    # 空白だけの文章も、答えがないものとして扱う
    sig { params(value: Answer).returns(T::Boolean) }
    def self.blank?(value) = value.nil? || value == [] || (value.is_a?(String) && value.match?(/\A[[:space:]]*\z/))
  end
end
